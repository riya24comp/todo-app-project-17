const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password_hash: { 
    type: String, 
    required: true 
  },
  // STORES USER ROLES (Admin or User)
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);