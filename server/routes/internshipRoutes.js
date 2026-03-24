// ============================================================
// Internship Routes
// ============================================================
const express = require('express');
const router = express.Router();
const {
  getInternships,
  getCompanyInternships,
  getInternship,
  trackClick,
  getFilterOptions,
} = require('../controllers/internshipController');

// Filter options must come before :id route
router.get('/filters', getFilterOptions);
router.get('/company-search', getCompanyInternships);
router.get('/', getInternships);
router.get('/:id', getInternship);
router.post('/:id/click', trackClick);

module.exports = router;
