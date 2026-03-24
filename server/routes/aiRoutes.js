const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCompanyResumeSuggestions } = require('../controllers/aiController');

router.post('/resume-suggestions', protect, getCompanyResumeSuggestions);

module.exports = router;
