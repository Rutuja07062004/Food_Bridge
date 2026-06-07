const { calculateFreshness } = require('../utils/freshnessEngine');

const freshnessService = {
  // Strategy hook (null by default, can be injected later)
  tensorFlowPredictor: null,

  /**
   * Predicts food freshness score, status, and predicted expiry time.
   * Follows the Strategy Pattern: delegates prediction to a TensorFlow provider if registered,
   * otherwise falls back to the local rule-based prediction engine.
   * 
   * @param {object} inputs Form data fields (category, preparationDate, preparationTime, storageType, currentTemperature)
   * @param {Buffer} [imageBuffer] Optional image file buffer for future image analysis models
   * @returns {Promise<object>} { score, status, expiryTime }
   */
  predictFreshness: async (inputs, imageBuffer) => {
    // If a TensorFlow predictor strategy is registered, attempt to run it
    if (freshnessService.tensorFlowPredictor) {
      try {
        console.log('[FreshnessService]: Running TensorFlow strategy prediction...');
        return await freshnessService.tensorFlowPredictor(inputs, imageBuffer);
      } catch (err) {
        console.error('[FreshnessService]: TensorFlow strategy failed. Falling back to Rule-Based engine:', err);
      }
    }

    // Fallback strategy: Rule-based engine
    const { category, preparationDate, preparationTime, storageType, currentTemperature } = inputs;
    const result = calculateFreshness(
      category,
      preparationDate,
      preparationTime,
      storageType,
      parseFloat(currentTemperature)
    );

    return result;
  },

  /**
   * Registration interface to inject a custom TensorFlow machine learning strategy later.
   * 
   * @param {function} predictorFn Strategy function taking (inputs, imageBuffer) and returning { score, status, expiryTime }
   */
  registerTensorFlowPredictor: (predictorFn) => {
    freshnessService.tensorFlowPredictor = predictorFn;
    console.log('[FreshnessService]: Custom TensorFlow strategy registered successfully.');
  }
};

module.exports = freshnessService;
