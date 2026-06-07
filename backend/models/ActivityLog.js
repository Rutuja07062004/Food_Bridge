const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // Can be null for anonymous registering/forgot password
  },
  action: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String 
  },
  ipAddress: { 
    type: String, 
    default: 'unknown' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
