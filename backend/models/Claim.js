const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  foodId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FoodListing', 
    required: true 
  },
  claimStatus: { 
    type: String, 
    enum: ['CLAIM_REQUESTED', 'APPROVED', 'REJECTED', 'READY_FOR_PICKUP', 'COLLECTED', 'COMPLETED', 'EXPIRED'], 
    default: 'CLAIM_REQUESTED' 
  },
  notes: {
    type: String,
    default: ''
  },
  pickupPreference: {
    type: String,
    default: 'NGO Pickup'
  },
  pickupDate: { 
    type: Date
  },
  pickupTime: { 
    type: String
  },
  pickupInstructions: {
    type: String,
    default: ''
  },
  collectedAt: { 
    type: Date 
  },
  completedAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Claim', claimSchema);
