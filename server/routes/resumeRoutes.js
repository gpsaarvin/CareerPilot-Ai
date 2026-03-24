// ============================================================
// Resume Routes
// ============================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadResume, analyzeResume, getRecommendations } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Multer config for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `resume_${req.user._id}_${Date.now()}.pdf`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.post('/analyze', protect, analyzeResume);

module.exports = router;
