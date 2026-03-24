const express = require('express');
const router = express.Router();
const { getCompanyInternships } = require('../controllers/internshipController');

router.get('/', getCompanyInternships);

module.exports = router;
