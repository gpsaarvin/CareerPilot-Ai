// ============================================================
// Internship Model
// Stores internship listings with external apply links
// ============================================================
const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Internship title is required'],
    trim: true,
    index: true,
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  company_logo: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    default: 'onsite',
  },
  skills_required: {
    type: [String],
    default: [],
  },
  stipend: {
    type: String,
    default: 'Unpaid',
  },
  description: {
    type: String,
    default: '',
  },
  // CRITICAL: The external link where users actually apply
  link: {
    type: String,
    required: [true, 'Application link is required'],
  },
  // Source platform (Internshala, LinkedIn, company site, etc.)
  source: {
    type: String,
    default: 'Direct',
  },
  posted_date: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
  },
  duration: {
    type: String,
    default: '3 months',
  },
  clicks: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Text index for search
internshipSchema.index({ title: 'text', company: 'text', skills_required: 'text' });

module.exports = mongoose.model('Internship', internshipSchema);
