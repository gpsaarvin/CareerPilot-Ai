// ============================================================
// CareerSync — Express Server Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const companySearchRoutes = require('./routes/companySearchRoutes');
const { protect } = require('./middleware/authMiddleware');
const { getCompanyResumeSuggestions } = require('./controllers/aiController');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server calls and local dev origins on any port.
    if (!origin) return callback(null, true);

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (isLocalhost) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/company-search', companySearchRoutes);
app.use('/api/apply', applicationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);
app.post('/api/ai-resume-suggestions', protect, getCompanyResumeSuggestions);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CareerSync API is running 🚀' });
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ---- Start Server ----
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CareerSync API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Internships: http://localhost:${PORT}/api/internships\n`);
  });
};

startServer();
