require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Task = require('./models/Task');

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is required. Configure backend/.env before seeding.');
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");

    // 1. Clear old data to prevent duplicate errors
    await User.deleteMany();
    await Task.deleteMany();
    console.log("Old data cleared.");

    // 2. Hash the password (password123)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Create Users (One Admin, One Regular User)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password_hash: passwordHash,
      role: 'admin' // Explicitly set to admin
    });

    const normalUser = await User.create({
      name: 'John Doe',
      email: 'john@test.com',
      password_hash: passwordHash,
      role: 'user' // Explicitly set to user (or just leave it, it defaults to 'user')
    });
    console.log("✅ Users created.");

    // 4. Create Tasks for the normal user using 'user_id'
    await Task.create([
      {
        user_id: normalUser._id, 
        title: 'Finish Database Schema',
        description: 'Create MongoDB models and seed data.',
        status: 'completed',
        priority: 'high',
        due_date: new Date()
      },
      {
        user_id: normalUser._id, 
        title: 'Review Backend API',
        description: 'Check if Member 3 is following the schema.',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(new Date().setDate(new Date().getDate() + 3))
      }
    ]);
    console.log("✅ Tasks created.");
    
    console.log("--- SEEDING COMPLETE ---");
    console.log("Admin Login: admin@test.com / password123");
    console.log("User Login: john@test.com / password123");
    
    // Exit the process successfully
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
};

seedDatabase();