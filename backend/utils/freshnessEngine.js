/**
 * Calculates food freshness score, status, and predicted expiry time.
 * 
 * @param {string} category Food category
 * @param {Date|string} prepDate Preparation Date
 * @param {string} prepTime Preparation Time (HH:MM format)
 * @param {string} storageType Storage Method
 * @param {number} temp Temperature in Celsius
 * @returns {object} { score, status, expiryTime }
 */
const calculateFreshness = (category, prepDate, prepTime, storageType, temp) => {
  if (!prepDate) {
    return {
      score: 100,
      status: 'Fresh',
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  let prepDateTime = new Date(prepDate);
  if (prepTime) {
    const [hours, minutes] = prepTime.split(':');
    prepDateTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
  }

  // Base shelf life rules (in hours) by Category and Storage Method
  const SHELF_LIFE_RULES = {
    'Dairy': { 'Room Temperature': 4, 'Refrigerated': 72, 'Frozen': 360, idealTemp: 4 },
    'Cooked Meals': { 'Room Temperature': 6, 'Refrigerated': 48, 'Frozen': 168, idealTemp: 4 },
    'Rice': { 'Room Temperature': 12, 'Refrigerated': 72, 'Frozen': 240, idealTemp: 4 },
    'Vegetables': { 'Room Temperature': 48, 'Refrigerated': 168, 'Frozen': 720, idealTemp: 8 },
    'Fruits': { 'Room Temperature': 72, 'Refrigerated': 240, 'Frozen': 720, idealTemp: 10 },
    'Bread': { 'Room Temperature': 72, 'Refrigerated': 120, 'Frozen': 720, idealTemp: 20 },
    'Snacks': { 'Room Temperature': 120, 'Refrigerated': 240, 'Frozen': 720, idealTemp: 20 },
    'Other': { 'Room Temperature': 24, 'Refrigerated': 72, 'Frozen': 240, idealTemp: 10 }
  };

  // Resolve category rules
  const catRules = SHELF_LIFE_RULES[category] || SHELF_LIFE_RULES['Other'];
  const baseShelfLife = catRules[storageType || 'Room Temperature'] || 24;
  const idealTemp = catRules.idealTemp;

  // Temperature penalty decay multiplier
  const tempDiff = Math.max(0, (temp !== undefined ? temp : 20) - idealTemp);
  const decayFactor = 1 + (tempDiff * 0.05); // Decay increases by 5% per degree above ideal temp
  const adjustedShelfLife = baseShelfLife / decayFactor; // Adjusted total shelf life in hours

  // Calculate elapsed time and remaining life
  const now = new Date();
  const elapsedHours = Math.max(0, (now - prepDateTime) / (1000 * 60 * 60));
  const remainingLifeHours = Math.max(0, adjustedShelfLife - elapsedHours);

  // Compute Freshness Score (0-100)
  let score = 0;
  if (adjustedShelfLife > 0) {
    score = Math.round((remainingLifeHours / adjustedShelfLife) * 100);
  }
  score = Math.min(100, Math.max(0, score));

  // Compute Expiry Time
  const expiryTime = new Date(prepDateTime.getTime() + adjustedShelfLife * 60 * 60 * 1000);

  // Map score to freshness status
  let status = 'Expired';
  if (score >= 80) {
    status = 'Fresh';
  } else if (score >= 50) {
    status = 'Consume Soon';
  } else if (score > 0) {
    status = 'Near Expiry';
  }

  return {
    score,
    status,
    expiryTime
  };
};

module.exports = {
  calculateFreshness
};
