const mongoose = require('mongoose');
const FoodListing = require('../models/FoodListing');
const User = require('../models/User');
const { getIO } = require('../config/socket');
const { sendEmail } = require('../utils/mailer');
const { logActivity } = require('../utils/logger');
const cloudinaryService = require('../services/cloudinaryService');

// @desc    Get donor statistics (Total, Active, Claimed, Expired)
// @route   GET /api/food/donor/stats
// @access  Private (Donor only)
exports.getDonorStats = async (req, res) => {
  try {
    const donorId = req.user.id;

    // Auto-expire overdue listings first
    await FoodListing.updateMany(
      { donorId, status: 'AVAILABLE', expiryTime: { $lt: new Date() } },
      { status: 'EXPIRED' }
    );

    const [total, active, claimed, expired, completed] = await Promise.all([
      FoodListing.countDocuments({ donorId }),
      FoodListing.countDocuments({ donorId, status: 'AVAILABLE' }),
      FoodListing.countDocuments({ donorId, status: { $in: ['CLAIM_REQUESTED', 'APPROVED', 'READY_FOR_PICKUP', 'COLLECTED'] } }),
      FoodListing.countDocuments({ donorId, status: 'EXPIRED' }),
      FoodListing.countDocuments({ donorId, status: 'COMPLETED' }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, active, claimed, expired, completed },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed donor analytics (Totals, NGOs Served, Trends)
// @route   GET /api/food/donor/analytics
// @access  Private (Donor only)
exports.getDonorAnalytics = async (req, res) => {
  try {
    const donorId = req.user.id;
    const donorObjectId = new mongoose.Types.ObjectId(donorId);

    // 1. Total Food Donated count
    const totalFoodDonated = await FoodListing.countDocuments({ donorId });

    // 2. Total NGOs Served (unique NGOs with COMPLETED/COLLECTED status)
    const uniqueNgos = await FoodListing.distinct('claimedBy', {
      donorId,
      status: { $in: ['COLLECTED', 'COMPLETED'] },
      claimedBy: { $ne: null }
    });
    const totalNgosServed = uniqueNgos.length;

    // 3. Top NGOs Served (names and claims counts)
    const topNgosServed = await FoodListing.aggregate([
      {
        $match: {
          donorId: donorObjectId,
          status: { $in: ['COLLECTED', 'COMPLETED'] },
          claimedBy: { $ne: null }
        }
      },
      { $group: { _id: '$claimedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'ngo'
        }
      },
      { $unwind: '$ngo' },
      { $project: { _id: 1, count: 1, name: '$ngo.name' } }
    ]);

    // 4. Monthly Donations Count Trend
    const monthlyDonations = await FoodListing.aggregate([
      { $match: { donorId: donorObjectId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // 5. Total Food Saved From Waste (sum of servings for COMPLETED/COLLECTED status)
    const foodSavedResult = await FoodListing.aggregate([
      {
        $match: {
          donorId: donorObjectId,
          status: { $in: ['COLLECTED', 'COMPLETED'] }
        }
      },
      { $group: { _id: null, totalServings: { $sum: '$servings' } } }
    ]);
    const foodSavedFromWaste = foodSavedResult[0]?.totalServings || 0;

    // 6. Food Saved Trend (servings by month)
    const monthlyFoodSaved = await FoodListing.aggregate([
      {
        $match: {
          donorId: donorObjectId,
          status: { $in: ['COLLECTED', 'COMPLETED'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          servings: { $sum: '$servings' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // 7. Category Distribution
    const categoryStats = await FoodListing.aggregate([
      { $match: { donorId: donorObjectId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalFoodDonated,
        totalNgosServed,
        topNgosServed,
        monthlyDonations,
        foodSavedFromWaste,
        monthlyFoodSaved,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new food listing
// @route   POST /api/food
// @access  Private (Donor only)
exports.createFood = async (req, res) => {
  try {
    const {
      foodName, category, quantity, servings,
      description, address, lat, lng, latitude, longitude, expiryTime,
    } = req.body;

    if (!foodName || !category || !quantity || !servings || !description || !address || !expiryTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Get pre-uploaded images if any
    let images = [];
    if (req.body.images) {
      try {
        images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (err) {
        console.warn('Failed to parse images array in createFood:', err);
      }
    }

    // Fallback if a single file upload is done directly on this endpoint
    if (req.file) {
      try {
        const uploadResult = await cloudinaryService.uploadFoodImage(req.file);
        images.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId
        });
      } catch (err) {
        console.error('Failed to upload single image file:', err);
      }
    }

    const foodListing = await FoodListing.create({
      donorId: req.user.id,
      foodName,
      category,
      quantity,
      servings: parseInt(servings),
      description,
      images,
      pickupLocation: {
        address,
        latitude: parseFloat(latitude) || parseFloat(lat) || 0,
        longitude: parseFloat(longitude) || parseFloat(lng) || 0,
        lat: parseFloat(lat) || parseFloat(latitude) || 0,
        lng: parseFloat(lng) || parseFloat(longitude) || 0,
      },
      expiryTime: new Date(expiryTime),
      status: 'AVAILABLE',
    });

    await logActivity(req.user.id, 'Food Listed', `Listed '${foodName}' (${quantity}, feeds ${servings})`, req);

    // Create notifications for NGOs and Admins
    try {
      const User = require('../models/User');
      const notificationService = require('../services/notificationService');

      const ngos = await User.find({ role: 'NGO', status: 'approved' });
      const ngoEmails = ngos.map(n => n.email);

      // Create notification and socket trigger for each approved NGO
      for (const ngo of ngos) {
        await notificationService.createNotification({
          userId: ngo._id,
          title: 'New Food Available',
          message: `${req.user.name} listed ${foodName} in ${category}.`,
          type: 'INFO',
          eventType: 'food_listed',
          relatedEntityId: foodListing._id
        });
      }

      // Notify Admins
      const admins = await User.find({ role: 'Admin' });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin._id,
          title: 'New Food Listing',
          message: `Donor "${req.user.name}" has listed surplus food: "${foodName}".`,
          type: 'INFO',
          eventType: 'food_listed',
          relatedEntityId: foodListing._id
        });
      }

      // Trigger background transactional emails to NGOs
      if (ngoEmails.length > 0) {
        await notificationService.createNotification({
          eventType: 'food_listed',
          relatedEntityId: foodListing._id,
          sendEmail: true,
          emailData: {
            ngoEmails: ngoEmails.join(','),
            foodName,
            donorName: req.user.name,
            category,
            servings,
            address
          }
        });
      }
    } catch (notifErr) {
      console.error('Failed to create listing notifications:', notifErr);
    }

    res.status(201).json({ success: true, data: foodListing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all food listings (with pagination, filters, search)
// @route   GET /api/food
// @access  Public
exports.getFoods = async (req, res) => {
  try {
    const { search, category, status, donorId, page = 1, limit = 9 } = req.query;

    const query = {};
    if (donorId) query.donorId = donorId;
    if (status) query.status = status.toUpperCase();
    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { foodName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'pickupLocation.address': { $regex: search, $options: 'i' } },
      ];
    }

    // Auto-expire overdue AVAILABLE listings
    await FoodListing.updateMany(
      { status: 'AVAILABLE', expiryTime: { $lt: new Date() } },
      { status: 'EXPIRED' }
    );

    const sortObj = {};
    if (req.query.sortBy === 'expiryTime') {
      sortObj.expiryTime = 1; // Expiring soonest first
    } else {
      sortObj.createdAt = -1; // Newest first
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const listings = await FoodListing.find(query)
      .populate('donorId', 'name email phone')
      .populate('claimedBy', 'name email phone')
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await FoodListing.countDocuments(query);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: listings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single food listing
// @route   GET /api/food/:id
// @access  Public
exports.getFoodById = async (req, res) => {
  try {
    const food = await FoodListing.findById(req.params.id)
      .populate('donorId', 'name email phone')
      .populate('claimedBy', 'name email phone');

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update food listing
// @route   PUT /api/food/:id
// @access  Private (Donor / Admin)
exports.updateFood = async (req, res) => {
  try {
    let food = await FoodListing.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    if (food.donorId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this listing' });
    }

    const { foodName, category, quantity, servings, description, address, lat, lng, latitude, longitude, expiryTime, status } = req.body;

    const updateData = {
      foodName:    foodName    || food.foodName,
      category:    category   || food.category,
      quantity:    quantity   || food.quantity,
      servings:    servings   ? parseInt(servings)   : food.servings,
      description: description|| food.description,
      expiryTime:  expiryTime ? new Date(expiryTime): food.expiryTime,
      status:      status     || food.status,
    };

    if (address || lat || lng || latitude || longitude) {
      updateData.pickupLocation = {
        address: address || food.pickupLocation.address,
        latitude: parseFloat(latitude) || parseFloat(lat) || food.pickupLocation.latitude || food.pickupLocation.lat,
        longitude: parseFloat(longitude) || parseFloat(lng) || food.pickupLocation.longitude || food.pickupLocation.lng,
        lat: parseFloat(lat) || parseFloat(latitude) || food.pickupLocation.lat || food.pickupLocation.latitude,
        lng: parseFloat(lng) || parseFloat(longitude) || food.pickupLocation.lng || food.pickupLocation.longitude,
      };
    }

    // Handle images array replacement
    let images = undefined;
    if (req.body.images) {
      try {
        images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (err) {
        console.warn('Failed to parse images array in updateFood:', err);
      }
    }

    if (images !== undefined) {
      updateData.images = images;
      updateData.image = images.length > 0 ? images[0].url : '';
    }

    // Handle image replacement via Cloudinary or local if a single file is uploaded
    if (req.file) {
      try {
        const uploadResult = await cloudinaryService.uploadFoodImage(req.file);
        updateData.images = [{
          url: uploadResult.url,
          publicId: uploadResult.publicId
        }];
        updateData.image = uploadResult.url;
      } catch (err) {
        console.error('Failed to upload image file on update:', err);
      }
    }

    food = await FoodListing.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await logActivity(req.user.id, 'Food Updated', `Updated listing '${food.foodName}'`, req);

    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete food listing
// @route   DELETE /api/food/:id
// @access  Private (Donor / Admin)
exports.deleteFood = async (req, res) => {
  try {
    const food = await FoodListing.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    if (food.donorId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    await FoodListing.findByIdAndDelete(req.params.id);
    await logActivity(req.user.id, 'Food Deleted', `Deleted listing '${food.foodName}'`, req);

    res.status(200).json({ success: true, message: 'Food listing removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark donation as completed
// @route   PATCH /api/food/:id/complete
// @access  Private
exports.completeFood = async (req, res) => {
  try {
    let food = await FoodListing.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    if (
      food.donorId.toString() !== req.user.id &&
      (food.claimedBy && food.claimedBy.toString() !== req.user.id) &&
      req.user.role !== 'Admin'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to complete this listing' });
    }

    food.status = 'COMPLETED';
    await food.save();

    const Claim = require('../models/Claim');
    const claim = await Claim.findOne({ foodId: food._id, claimStatus: { $ne: 'REJECTED' } }); // ClaimStatus might also be READY_FOR_PICKUP or COLLECTED
    if (claim) {
      claim.claimStatus = 'COMPLETED';
      claim.completedAt = new Date();
      await claim.save();
    }

    await logActivity(req.user.id, 'Donation Completed', `Marked '${food.foodName}' as completed`, req);

    const io = getIO();
    if (io && food.claimedBy) {
      const targetRoom = req.user.role === 'Donor'
        ? food.claimedBy.toString()
        : food.donorId.toString();
      io.to(targetRoom).emit('notification', {
        type: 'DONATION_COMPLETED',
        title: 'Donation Completed',
        message: `Food listing '${food.foodName}' has been successfully completed!`,
        data: food,
      });
    }

    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get nearby food listings
// @route   GET /api/food/nearby
// @access  Private
exports.getNearbyFood = async (req, res) => {
  try {
    const { lat, lng, latitude, longitude, radius = 5, sortBy = 'distance', category } = req.query;

    const userLat = parseFloat(latitude || lat);
    const userLng = parseFloat(longitude || lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ success: false, message: 'Valid coordinates (latitude/longitude) are required' });
    }

    const radKm = parseFloat(radius);

    // Query all AVAILABLE food listings
    const query = { status: 'AVAILABLE' };
    if (category) {
      query.category = category;
    }

    const listings = await FoodListing.find(query).populate('donorId', 'name email phone');

    // Haversine formula helper
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Calculate distance and map
    let result = listings.map(item => {
      const itemLat = item.pickupLocation.latitude || item.pickupLocation.lat || 0;
      const itemLng = item.pickupLocation.longitude || item.pickupLocation.lng || 0;
      const distance = calculateDistance(userLat, userLng, itemLat, itemLng);
      return {
        ...item.toObject(),
        distance: parseFloat(distance.toFixed(2))
      };
    });

    // Filter by radius limit
    result = result.filter(item => item.distance <= radKm);

    // Sort by criteria
    if (sortBy === 'distance') {
      result.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'expiryTime') {
      result.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));
    } else if (sortBy === 'quantity' || sortBy === 'servings') {
      result.sort((a, b) => b.servings - a.servings); // Highest servings first
    }

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
