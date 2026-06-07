const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const FoodListing = require('./models/FoodListing');
const Claim = require('./models/Claim');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await FoodListing.deleteMany();
    await Claim.deleteMany();
    await ActivityLog.deleteMany();
    await Notification.deleteMany();

    console.log('Seeding default users...');
    
    // Passwords will be hashed by mongoose pre-save hook
    const users = await User.create([
      {
        name: 'System Administrator',
        email: 'admin@foodbridge.com',
        phone: '+1 (555) 019-9000',
        password: 'password123',
        role: 'Admin',
        status: 'approved',
        latitude: 28.6139,
        longitude: 77.2090
      },
      {
        name: 'Green Olive Bistro (Donor)',
        email: 'donor@foodbridge.com',
        phone: '+1 (555) 014-4321',
        password: 'password123',
        role: 'Donor',
        status: 'approved',
        latitude: 28.6289,
        longitude: 77.2185
      },
      {
        name: 'Hope Community Kitchen (NGO)',
        email: 'ngo@foodbridge.com',
        phone: '+1 (555) 017-7654',
        password: 'password123',
        role: 'NGO',
        status: 'approved',
        latitude: 28.5973,
        longitude: 77.2235
      },
      {
        name: 'Shelter Outreach (NGO Pending)',
        email: 'pending_ngo@foodbridge.com',
        phone: '+1 (555) 018-8888',
        password: 'password123',
        role: 'NGO',
        status: 'pending',
        latitude: 28.6500,
        longitude: 77.1500
      }
    ]);

    console.log('Users seeded successfully!');
    
    const donorId = users[1]._id;
    const ngoId = users[2]._id;

    console.log('Seeding sample food listings...');

    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const tonight = new Date();
    tonight.setHours(tonight.getHours() + 6);

    const listings = await FoodListing.create([
      {
        donorId: donorId,
        foodName: 'Mixed Vegetables & Steamed Rice',
        category: 'Veg Meal',
        quantity: '8 kg',
        servings: 40,
        description: 'Freshly prepared steamed basmati rice with mixed vegetable curry. Kept in warmers, fully cooked and hygienic. Bring clean containers for pickup.',
        pickupLocation: {
          address: 'Green Olive Bistro, 12 Park Avenue, Connaught Place, New Delhi',
          lat: 28.6289,
          lng: 77.2185,
          latitude: 28.6289,
          longitude: 77.2185
        },
        expiryTime: tomorrow,
        status: 'AVAILABLE',
        preparationDate: new Date(),
        preparationTime: '12:00',
        storageType: 'Room Temperature',
        currentTemperature: 25
      },
      {
        donorId: donorId,
        foodName: 'Artisanal Breads & Danish Pastries',
        category: 'Bakery',
        quantity: '3 large baskets',
        servings: 20,
        description: 'Leftover fresh bakery items including croissants, cinnamon rolls, baguettes and sourdough. Packed separately in paper bags.',
        pickupLocation: {
          address: 'Green Olive Bistro, 12 Park Avenue, Connaught Place, New Delhi',
          lat: 28.6289,
          lng: 77.2185,
          latitude: 28.6289,
          longitude: 77.2185
        },
        expiryTime: tonight,
        status: 'AVAILABLE',
        preparationDate: new Date(),
        preparationTime: '09:00',
        storageType: 'Room Temperature',
        currentTemperature: 23
      },
      {
        donorId: donorId,
        foodName: 'Lentil Soup & Sautéed Veggies',
        category: 'Veg Meal',
        quantity: '5 Litres',
        servings: 25,
        description: 'Nutritious yellow lentil soup with carrots, broccoli and zucchini. Kept refrigerated since lunch. Needs reheating before consumption.',
        pickupLocation: {
          address: 'Green Olive Bistro, 12 Park Avenue, Connaught Place, New Delhi',
          lat: 28.6289,
          lng: 77.2185,
          latitude: 28.6289,
          longitude: 77.2185
        },
        expiryTime: tomorrow,
        status: 'CLAIM_REQUESTED',
        claimedBy: ngoId,
        preparationDate: new Date(),
        preparationTime: '11:00',
        storageType: 'Refrigerated',
        currentTemperature: 4
      }
    ]);

    console.log('Food listings seeded successfully!');

    console.log('Seeding sample claim...');
    await Claim.create({
      ngoId: ngoId,
      donorId: donorId,
      foodId: listings[2]._id,
      claimStatus: 'CLAIM_REQUESTED',
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    });

    console.log('Claims seeded successfully!');

    console.log('Seeding sample activity logs...');
    await ActivityLog.create([
      {
        userId: users[0]._id,
        action: 'System Initialized',
        details: 'Admin logged in and initialized the seed database.',
        ipAddress: '127.0.0.1'
      },
      {
        userId: users[1]._id,
        action: 'Food Listed',
        details: 'Green Olive Bistro listed "Mixed Vegetables & Steamed Rice".',
        ipAddress: '127.0.0.1'
      },
      {
        userId: users[2]._id,
        action: 'Food Claimed',
        details: 'Hope Community Kitchen claimed "Lentil Soup & Sautéed Veggies".',
        ipAddress: '127.0.0.1'
      }
    ]);

    console.log('Activity logs seeded successfully!');

    console.log('Seeding sample notifications...');
    const adminId = users[0]._id;

    await Notification.create([
      {
        userId: ngoId,
        title: 'New Surplus Food Available!',
        message: 'Green Olive Bistro (Donor) listed "Mixed Vegetables & Steamed Rice". Check it out now.',
        type: 'SUCCESS',
        eventType: 'food_listed',
        relatedEntityId: listings[0]._id.toString(),
        read: false
      },
      {
        userId: ngoId,
        title: 'NGO Account Approved',
        message: 'Welcome to FoodBridge! Your NGO organization registration is approved by the admin.',
        type: 'SUCCESS',
        eventType: 'ngo_approved',
        relatedEntityId: '',
        read: true
      },
      {
        userId: donorId,
        title: 'New Food Claim Requested',
        message: 'Hope Community Kitchen (NGO) has requested to claim your listing "Lentil Soup & Sautéed Veggies".',
        type: 'WARNING',
        eventType: 'claim_requested',
        relatedEntityId: listings[2]._id.toString(),
        read: false
      },
      {
        userId: adminId,
        title: 'New NGO Registration Pending',
        message: 'Shelter Outreach (NGO Pending) has registered and is awaiting approval.',
        type: 'INFO',
        eventType: 'ngo_registration',
        relatedEntityId: users[3]._id.toString(),
        read: false
      },
      {
        userId: ngoId,
        title: 'Pickup Scheduled',
        message: 'A pickup has been scheduled for "Lentil Soup & Sautéed Veggies" on tomorrow at 5:00 PM.',
        type: 'INFO',
        eventType: 'pickup_scheduled',
        relatedEntityId: listings[2]._id.toString(),
        read: false
      }
    ]);
    console.log('Notifications seeded successfully!');

    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
