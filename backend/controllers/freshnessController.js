const FoodListing = require('../models/FoodListing');
const freshnessService = require('../services/freshnessService');

/**
 * @desc    Get dynamic freshness prediction for user input parameters (interactive forms preview)
 * @route   POST /api/freshness/predict
 * @access  Private (Donor only)
 */
exports.predictFreshness = async (req, res) => {
  try {
    const { category, preparationDate, preparationTime, storageType, currentTemperature } = req.body;

    if (!category || !preparationDate) {
      return res.status(400).json({
        success: false,
        message: 'Category and preparation date are required to predict freshness.'
      });
    }

    const prediction = await freshnessService.predictFreshness({
      category,
      preparationDate,
      preparationTime,
      storageType,
      currentTemperature: currentTemperature !== undefined ? parseFloat(currentTemperature) : 20
    });

    res.status(200).json({
      success: true,
      data: {
        freshnessScore: prediction.score,
        freshnessStatus: prediction.status,
        predictedExpiryTime: prediction.expiryTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get freshness metrics for a specific food listing
 * @route   GET /api/freshness/:foodId
 * @access  Private
 */
exports.getFreshnessByFoodId = async (req, res) => {
  try {
    const food = await FoodListing.findById(req.params.foodId);
    
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        foodId: food._id,
        foodName: food.foodName,
        category: food.category,
        preparationDate: food.preparationDate,
        preparationTime: food.preparationTime,
        storageType: food.storageType,
        currentTemperature: food.currentTemperature,
        freshnessScore: food.freshnessScore,
        freshnessStatus: food.freshnessStatus,
        predictedExpiryTime: food.predictedExpiryTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
