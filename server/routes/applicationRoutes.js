// ============================================================
// Application Routes
// ============================================================
const express = require('express');
const router = express.Router();
const {
  applyToInternship,
  getApplications,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, applyToInternship);
router.get('/', protect, getApplications);
router.patch('/:id', protect, updateApplication);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
