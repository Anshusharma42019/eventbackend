const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login with email or mobile
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body; // email can be email or mobile
    
    const user = await User.findOne({
      $or: [
        { email: email },
        { mobile: email }
      ],
      is_active: true
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Role-based redirect info
    let redirectTo = '/admin';
    if (user.role === 'Sales Staff') redirectTo = '/sales';
    if (user.role === 'Gate Staff') redirectTo = '/gate';

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        mobile: user.mobile,
        name: user.name,
        role: user.role
      },
      redirectTo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create user (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { email, mobile, password, role, name } = req.body;
    
    const user = await User.create({
      email,
      mobile,
      password,
      role,
      name
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        mobile: user.mobile,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all users (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register admin (No auth required - for initial setup)
exports.registerAdmin = async (req, res) => {
  try {
    const { email, mobile, password, name } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    
    const admin = await User.create({
      email,
      mobile,
      password,
      role: 'Admin',
      name
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      user: {
        id: admin._id,
        email: admin.email,
        mobile: admin.mobile,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};