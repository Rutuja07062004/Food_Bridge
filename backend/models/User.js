const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a name'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Please add an email'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: { 
    type: String, 
    required: [true, 'Please add a phone number'], 
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, 'Please add a password'],
    minlength: 6,
    select: true
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Donor', 'NGO'], 
    required: [true, 'Please specify a role'] 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'suspended'], 
    default: function() {
      // NGOs might need manual approval, let's default NGOs to pending and others to approved
      return this.role === 'NGO' ? 'pending' : 'approved';
    } 
  },
  // NGO-specific fields
  registrationNumber: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  profilePhoto: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  verificationDocument: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
