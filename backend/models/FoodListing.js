const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  foodName: { 
    type: String, 
    required: [true, 'Please add a food name'], 
    trim: true 
  },
  category: { 
    type: String, 
    required: [true, 'Please specify a category'], 
    enum: ['Veg Meal', 'Non-Veg Meal', 'Bakery', 'Groceries', 'Fruits & Vegetables', 'Other'] 
  },
  quantity: { 
    type: String, 
    required: [true, 'Please specify quantity'] 
  },
  servings: { 
    type: Number, 
    required: [true, 'Please specify approximate number of servings'] 
  },
  description: { 
    type: String, 
    required: [true, 'Please add a description'] 
  },
  image: { 
    type: String, 
    default: '' 
  },
  images: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true }
    }
  ],
  pickupLocation: {
    address: { 
      type: String, 
      required: [true, 'Please add a pickup address'] 
    },
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    },
    lat: { 
      type: Number, 
      default: 0 
    },
    lng: { 
      type: Number, 
      default: 0 
    }
  },
  expiryTime: { 
    type: Date, 
    required: [true, 'Please specify expiry time'] 
  },
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'CLAIM_REQUESTED', 'APPROVED', 'REJECTED', 'READY_FOR_PICKUP', 'COLLECTED', 'COMPLETED', 'EXPIRED'], 
    default: 'AVAILABLE' 
  },
  claimedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  preparationDate: {
    type: Date
  },
  preparationTime: {
    type: String
  },
  storageType: {
    type: String,
    enum: ['Room Temperature', 'Refrigerated', 'Frozen'],
    default: 'Room Temperature'
  },
  currentTemperature: {
    type: Number,
    default: 20
  },
  freshnessScore: {
    type: Number,
    default: 100
  },
  freshnessStatus: {
    type: String,
    enum: ['Fresh', 'Consume Soon', 'Near Expiry', 'Expired'],
    default: 'Fresh'
  },
  predictedExpiryTime: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const { calculateFreshness } = require('../utils/freshnessEngine');

// Sync first image URL to legacy image string field and calculate freshness metrics
foodListingSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    this.image = this.images[0].url;
  }

  if (this.preparationDate) {
    const result = calculateFreshness(
      this.category,
      this.preparationDate,
      this.preparationTime,
      this.storageType,
      this.currentTemperature
    );
    this.freshnessScore = result.score;
    this.freshnessStatus = result.status;
    this.predictedExpiryTime = result.expiryTime;
  } else {
    this.predictedExpiryTime = this.expiryTime;
  }

  next();
});

module.exports = mongoose.model('FoodListing', foodListingSchema);
