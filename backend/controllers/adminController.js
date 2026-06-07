const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Claim = require('../models/Claim');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');
const { logActivity } = require('../utils/logger');

// Generate JWT Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_jwt_secret_key_antigravity_foodbridge', {
    expiresIn: '30d'
  });
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email, role: 'Admin' }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Admin credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Admin credentials' });
    }

    await logActivity(user._id, 'Admin Logged In', 'Admin logged in successfully', req);

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Dashboard Stats & Widgets
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, totalDonors, totalNgos,
      totalFoodListings, activeListings, claimedListings, completedDonations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Donor' }),
      User.countDocuments({ role: 'NGO' }),
      FoodListing.countDocuments(),
      FoodListing.countDocuments({ status: 'AVAILABLE' }),
      FoodListing.countDocuments({ status: { $in: ['CLAIM_REQUESTED', 'APPROVED', 'READY_FOR_PICKUP', 'COLLECTED'] } }),
      FoodListing.countDocuments({ status: 'COMPLETED' })
    ]);

    // Calculate Food Saved (sum servings of completed listings, assuming 1 serving = 0.5 kg roughly)
    const foodSavedResult = await FoodListing.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, totalServings: { $sum: '$servings' } } }
    ]);
    const servingsSaved = foodSavedResult[0] ? foodSavedResult[0].totalServings : 0;
    const foodSavedKg = Math.round(servingsSaved * 0.5); // 1 serving is approx 0.5 kg

    // Widgets: Recent Data
    const [recentDonations, recentClaims, recentNgos, activityFeed] = await Promise.all([
      FoodListing.find().populate('donorId', 'name').sort({ createdAt: -1 }).limit(5),
      Claim.find().populate('ngoId', 'name').populate('foodId', 'foodName').sort({ createdAt: -1 }).limit(5),
      User.find({ role: 'NGO' }).sort({ createdAt: -1 }).limit(5),
      ActivityLog.find().populate('userId', 'name role').sort({ createdAt: -1 }).limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalDonors,
          totalNgos,
          totalFoodListings,
          activeListings,
          claimedListings,
          completedDonations,
          foodSavedKg,
          servingsSaved
        },
        widgets: {
          recentDonations,
          recentClaims,
          recentNgos,
          activityFeed
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};
    if (role && role !== 'All') filter.role = role;
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user details & activity history
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activity = await ActivityLog.find({ userId: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { user, activity }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (Approve/Suspend/Activate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    await logActivity(req.user.id, 'User Status Modified', `Updated status of user '${user.name}' to '${status}'`, req);

    // Send notifications
    try {
      const notificationService = require('../services/notificationService');
      if (status === 'approved') {
        await notificationService.createNotification({
          userId: user._id,
          title: 'Account Activated',
          message: 'Your FoodBridge account has been approved and activated. Welcome!',
          type: 'SUCCESS',
          eventType: 'ngo_approved',
          relatedEntityId: user._id,
          sendEmail: true,
          emailData: {
            ngoEmail: user.email,
            ngoName: user.name
          }
        });
      } else if (status === 'suspended') {
        await notificationService.createNotification({
          userId: user._id,
          title: 'Account Suspended',
          message: 'Your account has been suspended by the administrator. Please contact support.',
          type: 'ERROR',
          eventType: 'account_suspended',
          relatedEntityId: user._id,
          sendEmail: true,
          emailData: {
            email: user.email,
            name: user.name
          }
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch user status notifications:', notifErr);
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    await logActivity(req.user.id, 'User Deleted', `Deleted account '${user.name}' (${user.email})`, req);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get NGOs by approval status
// @route   GET /api/admin/ngos
// @access  Private (Admin only)
exports.getNGOs = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: 'NGO' };
    if (status && status !== 'All') filter.status = status;

    const ngos = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: ngos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve NGO
// @route   PUT /api/admin/ngos/:id/approve
// @access  Private (Admin only)
exports.approveNGO = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'NGO') {
      return res.status(404).json({ success: false, message: 'NGO record not found' });
    }

    user.status = 'approved';
    await user.save();

    await logActivity(req.user.id, 'NGO Registration Approved', `Approved NGO '${user.name}'`, req);

    try {
      const notificationService = require('../services/notificationService');
      await notificationService.createNotification({
        userId: user._id,
        title: 'NGO Account Approved',
        message: 'Your NGO account registration has been approved and activated. You can now claim listings.',
        type: 'SUCCESS',
        eventType: 'ngo_approved',
        relatedEntityId: user._id,
        sendEmail: true,
        emailData: {
          ngoEmail: user.email,
          ngoName: user.name
        }
      });
    } catch (err) {
      console.error('NGO approval notification failed:', err);
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject NGO
// @route   PUT /api/admin/ngos/:id/reject
// @access  Private (Admin only)
exports.rejectNGO = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'NGO') {
      return res.status(404).json({ success: false, message: 'NGO record not found' });
    }

    user.status = 'suspended'; // Or rejected
    await user.save();

    await logActivity(req.user.id, 'NGO Registration Rejected', `Rejected NGO '${user.name}'`, req);

    try {
      await sendEmail({
        to: user.email,
        subject: 'FoodBridge NGO Registration Status',
        html: `<h3>Account Registration Notice</h3><p>Dear ${user.name}, your registration request has been rejected. contact support for appeals.</p>`
      });
    } catch (err) {
      console.error(err);
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all listings
// @route   GET /api/admin/food
// @access  Private (Admin only)
exports.getFoodListings = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.foodName = { $regex: search, $options: 'i' };
    }

    const food = await FoodListing.find(filter)
      .populate('donorId', 'name email')
      .populate('claimedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove food listing
// @route   DELETE /api/admin/food/:id
// @access  Private (Admin only)
exports.deleteFoodListing = async (req, res) => {
  try {
    const food = await FoodListing.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    await FoodListing.findByIdAndDelete(req.params.id);
    await logActivity(req.user.id, 'Food Listing Moderated', `Deleted food listing '${food.foodName}'`, req);

    res.status(200).json({ success: true, message: 'Listing moderated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all claims
// @route   GET /api/admin/claims
// @access  Private (Admin only)
exports.getClaims = async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate('ngoId', 'name')
      .populate('donorId', 'name')
      .populate('foodId', 'foodName quantity servings')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update claim status
// @route   PUT /api/admin/claims/:id/status
// @access  Private (Admin only)
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const claim = await Claim.findById(req.params.id).populate('foodId');
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const targetStatus = status.toUpperCase();
    claim.claimStatus = targetStatus;
    const food = claim.foodId;

    if (targetStatus === 'COMPLETED') {
      claim.completedAt = new Date();
      food.status = 'COMPLETED';
    } else if (targetStatus === 'REJECTED' || targetStatus === 'CANCELLED') {
      food.status = 'AVAILABLE';
      food.claimedBy = null;
    } else if (targetStatus === 'COLLECTED') {
      food.status = 'COMPLETED'; // Considered completed when collected
      claim.completedAt = new Date();
    } else {
      food.status = targetStatus;
    }

    await claim.save();
    await food.save();

    await logActivity(req.user.id, 'Admin Updated Claim', `Set claim status of '${food.foodName}' to '${status}'`, req);

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Private (Admin only)
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private (Admin only)
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Analytics Dashboard Data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeNgos = await User.countDocuments({ role: 'NGO', status: 'approved' });
    const totalFoodDonated = await FoodListing.countDocuments();
    
    // Top Donors (aggregating listing counts by donorId)
    const topDonors = await FoodListing.aggregate([
      { $group: { _id: '$donorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donor'
        }
      },
      { $unwind: '$donor' },
      { $project: { _id: 1, count: 1, name: '$donor.name' } }
    ]);

    // Monthly Donations (aggregating listing counts by year/month)
    const monthlyDonations = await FoodListing.aggregate([
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

    // Food Category Distribution
    const categoryStats = await FoodListing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Donation Growth Trend
    const growthTrend = await FoodListing.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    // Total NGOs Served (unique NGOs with COMPLETED/COLLECTED status)
    const uniqueNgos = await FoodListing.distinct('claimedBy', {
      status: { $in: ['COLLECTED', 'COMPLETED'] },
      claimedBy: { $ne: null }
    });
    const totalNgosServed = uniqueNgos.length;

    // Total Food Saved From Waste (sum of servings for COMPLETED/COLLECTED status)
    const foodSavedResult = await FoodListing.aggregate([
      { $match: { status: { $in: ['COLLECTED', 'COMPLETED'] } } },
      { $group: { _id: null, totalServings: { $sum: '$servings' } } }
    ]);
    const foodSavedFromWaste = foodSavedResult[0]?.totalServings || 0;

    // Monthly Food Saved Trend (servings by year/month)
    const monthlyFoodSaved = await FoodListing.aggregate([
      { $match: { status: { $in: ['COLLECTED', 'COMPLETED'] } } },
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

    // Top NGOs Served (claims counts)
    const topNgosServed = await FoodListing.aggregate([
      {
        $match: {
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

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeNgos,
        totalFoodDonated,
        totalNgosServed,
        foodSavedFromWaste,
        topDonors,
        topNgosServed,
        monthlyDonations,
        monthlyFoodSaved,
        categoryStats,
        growthTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
