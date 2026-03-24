// ============================================================
// Application Model
// Tracks user's saved/applied internships and their status
// ============================================================
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true,
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'interviewing', 'rejected', 'accepted'],
    default: 'saved',
  },
  applied_date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Prevent duplicate applications
applicationSchema.index({ user: 1, internship: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
