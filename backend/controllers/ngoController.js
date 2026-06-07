const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/logger');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_jwt_secret_key_antigravity_foodbridge', {
    expiresIn: '30d'
  });
};

// @desc    Register NGO
// @route   POST /api/ngo/register
// @access  Public
exports.registerNGO = async (req, res) => {
  try {
    const { ngoName, registrationNumber, contactPerson, email, phone, address, password, verificationDocument } = req.body;

    if (!ngoName || !registrationNumber || !contactPerson || !email || !phone || !address || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all registration fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account already exists with this email address' });
    }

    // Create NGO user
    const ngoUser = await User.create({
      name: ngoName, // Map ngoName to name field
      email,
      phone,
      password,
      role: 'NGO',
      registrationNumber,
      contactPerson,
      address,
      status: 'pending', // Default to pending until Admin approves
      verificationDocument: verificationDocument || { url: '', publicId: '' }
    });

    if (ngoUser) {
      await logActivity(ngoUser._id, 'NGO Registered', `NGO registered successfully: ${ngoName}`, req);

      // Create admin notification
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          title: 'New NGO Registration',
          message: `New NGO "${ngoName}" has registered and is pending approval.`,
          type: 'NGO_REGISTRATION'
        });
      } catch (notifErr) {
        console.error('Failed to create registration notification:', notifErr);
      }

      res.status(201).json({
        success: true,
        token: generateToken(ngoUser._id),
        user: {
          _id: ngoUser._id,
          name: ngoUser.name,
          email: ngoUser.email,
          phone: ngoUser.phone,
          role: ngoUser.role,
          status: ngoUser.status,
          registrationNumber: ngoUser.registrationNumber,
          contactPerson: ngoUser.contactPerson,
          address: ngoUser.address
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid NGO data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    NGO Login
// @route   POST /api/ngo/login
// @access  Public
exports.loginNGO = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for NGO user
    const user = await User.findOne({ email, role: 'NGO' }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid NGO credentials' });
    }

    // Check if suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid NGO credentials' });
    }

    await logActivity(user._id, 'NGO Logged In', 'NGO logged in successfully', req);

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        registrationNumber: user.registrationNumber,
        contactPerson: user.contactPerson,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get NGO Profile
// @route   GET /api/ngo/profile
// @access  Private (NGO Only)
exports.getNGOProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'NGO profile not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        registrationNumber: user.registrationNumber,
        contactPerson: user.contactPerson,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update NGO Profile
// @route   PUT /api/ngo/profile
// @access  Private (NGO Only)
exports.updateNGOProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }

    const { ngoName, contactPerson, phone, address, registrationNumber, currentPassword, newPassword } = req.body;

    // Update simple fields
    if (ngoName) user.name = ngoName;
    if (contactPerson) user.contactPerson = contactPerson;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (registrationNumber) user.registrationNumber = registrationNumber;

    // Update password if requested
    if (currentPassword && newPassword) {
      const dbUser = await User.findById(req.user.id).select('+password');
      const isMatch = await dbUser.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();
    await logActivity(user._id, 'NGO Profile Updated', 'NGO updated profile details', req);

    res.status(200).json({
      success: true,
      message: 'NGO profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        registrationNumber: user.registrationNumber,
        contactPerson: user.contactPerson,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
