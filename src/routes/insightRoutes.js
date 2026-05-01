const express = require('express');
const { getAnomalies } = require('../controllers/insightController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/anomalies', getAnomalies);

module.exports = router;
