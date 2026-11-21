
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    message: 'Backend server is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

// Attempt database connection
connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server };
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const crypto = require('crypto');
const path = require('path');
const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../database/models/Task');
const User = require('../database/models/User');

const app = express();
const frontendPath = path.join(__dirname, '..', 'frontend');
const statuses = ['pending', 'in-progress', 'completed'];
const priorities = ['low', 'medium', 'high'];

app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use(express.json({ limit: '32kb' }));

function httpError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function safeUser(user) {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
    };
}

function createToken(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw httpError('JWT_SECRET must be set to at least 32 characters.', 500);
    }

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        sub: String(user._id),
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    })).toString('base64url');
    const content = `${header}.${payload}`;
    const signature = crypto.createHmac('sha256', secret).update(content).digest('base64url');

    return `${content}.${signature}`;
}

function verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw httpError('Authentication is not configured.', 500);

    const parts = token.split('.');
    if (parts.length !== 3) throw httpError('Invalid or expired session.', 401);

    const content = `${parts[0]}.${parts[1]}`;
    const expected = crypto.createHmac('sha256', secret).update(content).digest();
    const provided = Buffer.from(parts[2], 'base64url');

    if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
        throw httpError('Invalid or expired session.', 401);
    }

    let payload;
    try {
        payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch (error) {
        throw httpError('Invalid or expired session.', 401);
    }

    if (!payload.sub || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) {
        throw httpError('Invalid or expired session.', 401);
    }

    return payload;
}

async function requireAuth(req, res, next) {
    const authorization = req.get('authorization') || '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return res.status(401).json({ message: 'Please log in to continue.' });

    try {
        const payload = verifyToken(match[1]);
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ message: 'Invalid or expired session.' });
        req.user = user;
        next();
    } catch (error) {
        if (error.statusCode === 401) {
            return res.status(401).json({ message: error.message });
        }
        next(error);
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to perform this action.' });
    }
    next();
}

function taskPayload(body, partial = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw httpError('A task object is required.', 400);
    }

    const payload = {};
    const has = key => Object.prototype.hasOwnProperty.call(body, key);

    if (has('title') || !partial) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
            throw httpError('Task title is required.', 400);
        }
        payload.title = body.title.trim();
    }

    if (has('description') || !partial) {
        if (body.description !== undefined && typeof body.description !== 'string') {
            throw httpError('Description must be a string.', 400);
        }
        payload.description = (body.description || '').trim();
    }

    if (has('status')) {
        if (!statuses.includes(body.status)) throw httpError('Invalid status.', 400);
        payload.status = body.status;
    } else if (!partial) {
        payload.status = 'pending';
    }

    if (has('priority')) {
        if (!priorities.includes(body.priority)) throw httpError('Invalid priority.', 400);
        payload.priority = body.priority;
    } else if (!partial) {
        payload.priority = 'medium';
    }

    if (has('due_date') || !partial) {
        if (body.due_date === null || body.due_date === '') {
            payload.due_date = null;
        } else {
            if (typeof body.due_date !== 'string' || Number.isNaN(Date.parse(body.due_date))) {
                throw httpError('Due date must be a valid date or null.', 400);
            }
            payload.due_date = new Date(body.due_date);
        }
    }

    if (partial && Object.keys(payload).length === 0) {
        throw httpError('At least one task field must be provided.', 400);
    }

    return payload;
}

app.get('/api/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
        status: connected ? 'ok' : 'unavailable',
        database: connected ? 'connected' : 'disconnected'
    });
});

app.post('/api/auth/register', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) {
        throw httpError('Name, email and password are required.', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw httpError('Please enter a valid email address.', 400);
    }
    if (password.length < 6) throw httpError('Password must be at least 6 characters.', 400);

    const existing = await User.findOne({ email });
    if (existing) throw httpError('An account with this email already exists.', 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash: passwordHash, role: 'user' });
    res.status(201).json({ message: 'Account created.', user: safeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = email ? await User.findOne({ email }) : null;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw httpError('Incorrect email or password. Please try again.', 401);
    }

    res.json({ token: createToken(user), user: safeUser(user) });
});

app.get('/api/tasks', requireAuth, async (req, res) => {
    const tasks = await Task.find({ user_id: req.user._id }).sort({ created_at: -1 });
    res.json({ tasks });
});

app.post('/api/tasks', requireAuth, async (req, res) => {
    const task = await Task.create({
        ...taskPayload(req.body),
        user_id: req.user._id
    });
    res.status(201).json({ message: 'Task created.', task });
});

app.put('/api/tasks/:id', requireAuth, async (req, res) => {
    const task = await Task.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!task) throw httpError('Task not found.', 404);

    Object.assign(task, taskPayload(req.body, true));
    await task.save();
    res.json({ message: 'Task updated.', task });
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!task) throw httpError('Task not found.', 404);
    res.json({ message: 'Task deleted.' });
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    const users = await User.find().sort({ created_at: -1 });
    res.json({ users: users.map(safeUser) });
});

app.get('/api/admin/tasks', requireAuth, requireAdmin, async (req, res) => {
    const tasks = await Task.find()
        .populate('user_id', 'name email')
        .sort({ created_at: -1 });
    res.json({ tasks });
});

app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found.' });
});

app.use(express.static(frontendPath));

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    let statusCode = error.statusCode || error.status || 500;
    if (error.code === 11000) statusCode = 409;
    else if (error.name === 'ValidationError' || error.name === 'CastError') statusCode = 400;
    else if (error.type === 'entity.parse.failed') statusCode = 400;
    else if (error.type === 'entity.too.large') statusCode = 413;

    if (statusCode >= 500) console.error(error);
    const message = statusCode >= 500
        ? 'The server could not complete the request.'
        : error.message || 'The request could not be completed.';

    res.status(statusCode).json({ message });
});

async function startServer() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is required. Configure backend/.env before starting the server.');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be set to at least 32 characters in backend/.env.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    const port = Number(process.env.PORT || 5000);
    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            console.log(`TaskFlow is available at http://localhost:${port}`);
            resolve(server);
        });
        server.once('error', reject);
    });
}

if (require.main === module) {
    startServer().catch(error => {
        console.error('Unable to start TaskFlow:', error.message);
        process.exitCode = 1;
    });
}

module.exports = { app, startServer };
