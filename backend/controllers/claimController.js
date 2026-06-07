const Claim = require('../models/Claim');
const FoodListing = require('../models/FoodListing');
const User = require('../models/User');
const { getIO } = require('../config/socket');
const { sendEmail } = require('../utils/mailer');
const { logActivity } = require('../utils/logger');

// @desc    Claim an available food listing
// @route   POST /api/claim
// @access  Private (NGO only)
exports.claimFood = async (req, res) => {
  try {
    const { foodId, pickupTime } = req.body;

    if (!foodId || !pickupTime) {
      return res.status(400).json({ success: false, message: 'Please provide foodId and pickupTime' });
    }

    // Verify user status is approved
    if (req.user.role !== 'NGO') {
      return res.status(403).json({ success: false, message: 'Only NGOs can claim food' });
    }

    if (req.user.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Your NGO account is pending approval by the administrator.' });
    }

    // Find the food listing
    const food = await FoodListing.findById(foodId).populate('donorId', 'name email phone');
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    if (food.status !== 'available') {
      return res.status(400).json({ success: false, message: `Food listing status is '${food.status}' and cannot be claimed.` });
    }

    // Check expiry
    if (new Date(food.expiryTime) < new Date()) {
      food.status = 'expired';
      await food.save();
      return res.status(400).json({ success: false, message: 'This food listing has expired.' });
    }

    // Create the claim record
    const claim = await Claim.create({
      ngoId: req.user.id,
      foodId: food._id,
      claimStatus: 'claimed',
      pickupTime: new Date(pickupTime)
    });

    // Update food listing
    food.status = 'claimed';
    food.claimedBy = req.user.id;
    await food.save();

    await logActivity(req.user.id, 'Food Claimed', `Claimed listing '${food.foodName}' from ${food.donorId.name}`, req);

    // Socket.io notify donor
    const io = getIO();
    if (io) {
      io.to(food.donorId._id.toString()).emit('notification', {
        type: 'FOOD_CLAIMED',
        title: 'Donation Claimed!',
        message: `${req.user.name} has claimed your food listing: ${food.foodName}.`,
        data: { claim, food }
      });
    }

    // Email notification to the donor
    try {
      const emailContent = `
        <h2>Good News! Your food donation has been claimed.</h2>
        <p><strong>Food Listing:</strong> ${food.foodName}</p>
        <p><strong>Claimed By NGO:</strong> ${req.user.name}</p>
        <p><strong>NGO Contact:</strong> ${req.user.phone} (${req.user.email})</p>
        <p><strong>Scheduled Pickup Time:</strong> ${new Date(pickupTime).toLocaleString()}</p>
        <p>Please keep the food ready for pickup. Thank you for making a difference!</p>
      `;
      
      await sendEmail({
        to: food.donorId.email,
        subject: `Donation Claimed: ${food.foodName}`,
        html: emailContent
      });
    } catch (mailErr) {
      console.error('Donor email notification failed:', mailErr);
    }

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get claims (User dependent: NGO sees their claims, Donor sees claims on their food, Admin sees all)
// @route   GET /api/claim
// @access  Private
exports.getClaims = async (req, res) => {
  try {
    let claimsQuery = {};

    if (req.user.role === 'NGO') {
      claimsQuery.ngoId = req.user.id;
    } else if (req.user.role === 'Donor') {
      // Find food listings owned by this donor
      const donorFoodIds = await FoodListing.find({ donorId: req.user.id }).select('_id');
      claimsQuery.foodId = { $in: donorFoodIds };
    }

    const claims = await Claim.find(claimsQuery)
      .populate('ngoId', 'name email phone')
      .populate({
        path: 'foodId',
        populate: {
          path: 'donorId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update claim status (e.g. from claimed to picked_up or completed, or cancelled)
// @route   PATCH /api/claim/:id/status
// @access  Private
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'picked_up', 'completed', 'cancelled'
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'name email phone')
      .populate('foodId');
      
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Auth validation
    const food = claim.foodId;
    const isNgo = claim.ngoId._id.toString() === req.user.id;
    const isDonor = food.donorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isNgo && !isDonor && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this claim' });
    }

    claim.claimStatus = status;
    if (status === 'completed') {
      claim.completedAt = new Date();
      food.status = 'completed';
    } else if (status === 'cancelled') {
      food.status = 'available';
      food.claimedBy = null;
    } else if (status === 'picked_up') {
      food.status = 'claimed'; // stays claimed but indicates in transit
    }
    
    await claim.save();
    await food.save();

    await logActivity(req.user.id, 'Claim Status Updated', `Claim status set to '${status}' for food '${food.foodName}'`, req);

    // Notify other party
    const io = getIO();
    if (io) {
      // Determine recipient room
      const recipientRoom = isNgo ? food.donorId.toString() : claim.ngoId._id.toString();
      io.to(recipientRoom).emit('notification', {
        type: 'CLAIM_STATUS_UPDATE',
        title: 'Claim Update',
        message: `The claim status for '${food.foodName}' has been updated to '${status}'.`,
        data: { claim, food }
      });
    }

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
