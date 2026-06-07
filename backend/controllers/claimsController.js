const Claim = require('../models/Claim');
const FoodListing = require('../models/FoodListing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const { sendEmail } = require('../utils/mailer');
const { logActivity } = require('../utils/logger');

// Helper to delegate workflow updates to unified notificationService
const sendWorkflowNotifications = async ({
  userId,
  title,
  message,
  type, // INFO, SUCCESS, WARNING, ERROR
  eventType, // socket event name, e.g. 'claim_requested', 'claim_approved', etc.
  claimId,
  sendEmail = false,
  emailData = {}
}) => {
  try {
    const notificationService = require('../services/notificationService');
    await notificationService.createNotification({
      userId,
      title,
      message,
      type,
      eventType,
      relatedEntityId: claimId,
      sendEmail,
      emailData
    });
  } catch (err) {
    console.error('Workflow notification dispatch failed:', err);
  }
};

// @desc    Submit Claim Request
// @route   POST /api/claims
// @access  Private (NGO only)
exports.claimFood = async (req, res) => {
  try {
    const { foodId, notes, pickupPreference } = req.body;

    if (!foodId) {
      return res.status(400).json({ success: false, message: 'Please provide foodId' });
    }

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

    if (food.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: `Food listing status is '${food.status}' and cannot be claimed.` });
    }

    // Check expiry
    if (new Date(food.expiryTime) < new Date()) {
      food.status = 'EXPIRED';
      await food.save();
      return res.status(400).json({ success: false, message: 'This food listing has expired.' });
    }

    // Create the claim record
    const claim = await Claim.create({
      ngoId: req.user.id,
      donorId: food.donorId._id,
      foodId: food._id,
      claimStatus: 'CLAIM_REQUESTED',
      notes: notes || '',
      pickupPreference: pickupPreference || 'NGO Pickup'
    });

    // Update food listing status to CLAIM_REQUESTED
    food.status = 'CLAIM_REQUESTED';
    food.claimedBy = req.user.id;
    await food.save();

    await logActivity(req.user.id, 'Claim Submitted', `Requested claim on '${food.foodName}' from ${food.donorId.name}`, req);

    // Notify Donor
    await sendWorkflowNotifications({
      userId: food.donorId._id,
      title: 'New Claim Request',
      message: `NGO "${req.user.name}" has requested to claim your listing: "${food.foodName}".`,
      type: 'INFO',
      eventType: 'claim_requested',
      claimId: claim._id,
      sendEmail: true,
      emailData: {
        donorEmail: food.donorId.email,
        foodName: food.foodName,
        ngoName: req.user.name,
        notes: notes || 'None'
      }
    });

    // Notify Admins
    try {
      const admins = await User.find({ role: 'Admin' });
      for (const admin of admins) {
        await sendWorkflowNotifications({
          userId: admin._id,
          title: 'New Claim Alert',
          message: `NGO "${req.user.name}" has requested a claim on "${food.foodName}".`,
          type: 'INFO',
          eventType: 'claim_requested',
          claimId: claim._id
        });
      }
    } catch (adminErr) {
      console.error('Failed to notify admins of new claim:', adminErr);
    }

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get claims (Role-based: NGO sees own, Donor sees claims on their listings, Admin sees all)
// @route   GET /api/claims
// @access  Private
exports.getClaims = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'NGO') {
      filter.ngoId = req.user.id;
    } else if (req.user.role === 'Donor') {
      filter.donorId = req.user.id;
    }

    const claims = await Claim.find(filter)
      .populate('ngoId', 'name email phone registrationNumber contactPerson address')
      .populate('donorId', 'name email phone address')
      .populate('foodId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get claim by ID
// @route   GET /api/claims/:id
// @access  Private
exports.getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'name email phone registrationNumber contactPerson address')
      .populate('donorId', 'name email phone address')
      .populate('foodId');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Auth check
    const isNgo = claim.ngoId._id.toString() === req.user.id;
    const isDonor = claim.donorId._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isNgo && !isDonor && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this claim' });
    }

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve Claim
// @route   PUT /api/claims/:id/approve
// @access  Private (Donor only)
exports.approveClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'name email phone')
      .populate('foodId');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.donorId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized. Only the listing donor can approve.' });
    }

    if (claim.claimStatus !== 'CLAIM_REQUESTED') {
      return res.status(400).json({ success: false, message: `Claim is in status '${claim.claimStatus}' and cannot be approved.` });
    }

    claim.claimStatus = 'APPROVED';
    const food = claim.foodId;
    food.status = 'APPROVED';

    await claim.save();
    await food.save();

    await logActivity(req.user.id, 'Claim Approved', `Approved claim by NGO '${claim.ngoId.name}' for '${food.foodName}'`, req);

    // Notify NGO
    await sendWorkflowNotifications({
      userId: claim.ngoId._id,
      title: 'Claim Approved',
      message: `Donor "${req.user.name}" has approved your claim for "${food.foodName}".`,
      type: 'SUCCESS',
      eventType: 'claim_approved',
      claimId: claim._id,
      sendEmail: true,
      emailData: {
        ngoEmail: claim.ngoId.email,
        foodName: food.foodName,
        donorName: req.user.name
      }
    });

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject Claim
// @route   PUT /api/claims/:id/reject
// @access  Private (Donor only)
exports.rejectClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'name email phone')
      .populate('foodId');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.donorId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized. Only the listing donor can reject.' });
    }

    if (claim.claimStatus !== 'CLAIM_REQUESTED') {
      return res.status(400).json({ success: false, message: `Claim is in status '${claim.claimStatus}' and cannot be rejected.` });
    }

    claim.claimStatus = 'REJECTED';
    const food = claim.foodId;
    food.status = 'AVAILABLE';
    food.claimedBy = null;

    await claim.save();
    await food.save();

    await logActivity(req.user.id, 'Claim Rejected', `Rejected claim by NGO '${claim.ngoId.name}' for '${food.foodName}'`, req);

    // Notify NGO
    await sendWorkflowNotifications({
      userId: claim.ngoId._id,
      title: 'Claim Rejected',
      message: `Donor "${req.user.name}" has rejected your claim request for "${food.foodName}".`,
      type: 'ERROR',
      eventType: 'claim_rejected',
      claimId: claim._id,
      sendEmail: true,
      emailData: {
        ngoEmail: claim.ngoId.email,
        foodName: food.foodName,
        donorName: req.user.name
      }
    });

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule Pickup Details
// @route   PUT /api/claims/:id/schedule-pickup
// @access  Private (Donor only)
exports.schedulePickup = async (req, res) => {
  try {
    const { pickupDate, pickupTime, pickupInstructions } = req.body;

    if (!pickupDate || !pickupTime) {
      return res.status(400).json({ success: false, message: 'Please provide pickupDate and pickupTime' });
    }

    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'name email phone')
      .populate('foodId');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.donorId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized. Only the donor can schedule pickup.' });
    }

    if (claim.claimStatus !== 'APPROVED' && claim.claimStatus !== 'READY_FOR_PICKUP') {
      return res.status(400).json({ success: false, message: 'Claim must be in APPROVED status to schedule.' });
    }

    claim.claimStatus = 'READY_FOR_PICKUP';
    claim.pickupDate = new Date(pickupDate);
    claim.pickupTime = pickupTime;
    claim.pickupInstructions = pickupInstructions || '';

    const food = claim.foodId;
    food.status = 'READY_FOR_PICKUP';

    await claim.save();
    await food.save();

    await logActivity(req.user.id, 'Pickup Scheduled', `Scheduled pickup details for claim '${claim._id}'`, req);

    // Notify NGO
    await sendWorkflowNotifications({
      userId: claim.ngoId._id,
      title: 'Surplus Food Ready for Pickup',
      message: `Donor "${req.user.name}" has scheduled pickup for "${food.foodName}". Ready for collection!`,
      type: 'SUCCESS',
      eventType: 'pickup_scheduled',
      claimId: claim._id,
      sendEmail: true,
      emailData: {
        ngoEmail: claim.ngoId.email,
        foodName: food.foodName,
        donorName: req.user.name,
        pickupDate,
        pickupTime,
        instructions: pickupInstructions
      }
    });

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark Claim as Collected
// @route   PUT /api/claims/:id/mark-collected
// @access  Private (NGO only)
exports.markCollected = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'name email phone')
      .populate({
        path: 'foodId',
        populate: { path: 'donorId', select: 'name email phone' }
      });

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.ngoId._id.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Only the claiming NGO can mark it as collected.' });
    }

    if (claim.claimStatus !== 'READY_FOR_PICKUP') {
      return res.status(400).json({ success: false, message: 'Food listing is not ready for pickup.' });
    }

    claim.claimStatus = 'COLLECTED';
    claim.collectedAt = new Date();

    const food = claim.foodId;
    food.status = 'COLLECTED';

    await claim.save();
    await food.save();

    await logActivity(req.user.id, 'Claim Marked Collected', `NGO marked surplus food '${food.foodName}' as collected`, req);

    // Notify Donor
    await sendWorkflowNotifications({
      userId: food.donorId._id,
      title: 'Surplus Food Collected',
      message: `NGO "${req.user.name}" has collected "${food.foodName}". Please confirm handover completion.`,
      type: 'SUCCESS',
      eventType: 'food_collected',
      claimId: claim._id
    });

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm Completion
// @route   PUT /api/claims/:id/confirm-completion
// @access  Private (Donor only)
exports.confirmCompletion = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('ngoId', 'name email phone')
      .populate('foodId');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.donorId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Only the donor can verify and complete donation.' });
    }

    if (claim.claimStatus !== 'COLLECTED') {
      return res.status(400).json({ success: false, message: 'Handover must be marked as COLLECTED by the NGO before completion.' });
    }

    claim.claimStatus = 'COMPLETED';
    claim.completedAt = new Date();

    const food = claim.foodId;
    food.status = 'COMPLETED';

    await claim.save();
    await food.save();

    await logActivity(req.user.id, 'Donation Confirmed Complete', `Donor verified distribution of '${food.foodName}'`, req);

    // Notify NGO
    await sendWorkflowNotifications({
      userId: claim.ngoId._id,
      title: 'Donation Completed',
      message: `Donor "${req.user.name}" has verified the handover of "${food.foodName}". Complete!`,
      type: 'SUCCESS',
      eventType: 'donation_completed',
      claimId: claim._id,
      sendEmail: true,
      emailData: {
        email: claim.ngoId.email,
        foodName: food.foodName,
        partnerName: req.user.name,
        isDonor: false
      }
    });

    // Notify Donor
    await sendWorkflowNotifications({
      userId: claim.donorId._id,
      title: 'Donation Completed',
      message: `You have successfully verified the collection of "${food.foodName}" by "${claim.ngoId.name}". Thank you!`,
      type: 'SUCCESS',
      eventType: 'donation_completed',
      claimId: claim._id,
      sendEmail: true,
      emailData: {
        email: claim.donorId.email,
        foodName: food.foodName,
        partnerName: claim.ngoId.name,
        isDonor: true
      }
    });

    // Notify Admins
    try {
      const admins = await User.find({ role: 'Admin' });
      for (const admin of admins) {
        await sendWorkflowNotifications({
          userId: admin._id,
          title: 'Donation Completed Alert',
          message: `Donor "${req.user.name}" completed surplus handover of "${food.foodName}" to NGO "${claim.ngoId.name}".`,
          type: 'SUCCESS',
          eventType: 'donation_completed',
          claimId: claim._id
        });
      }
    } catch (adminErr) {
      console.error('Failed to notify admins of completed donation:', adminErr);
    }

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
