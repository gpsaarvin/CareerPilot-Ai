// ============================================================
// Auth Controller
// Google Sign-In + JWT session token
// ============================================================
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { getOrCreateUser, users } = require('../data/inMemoryStore');

const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      google_id: user.google_id,
    },
    process.env.JWT_SECRET || 'dev-secret-change-this',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// @desc    Google login/signup
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential, profile = {} } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const configuredClientId = process.env.GOOGLE_CLIENT_ID;
    const hasClientId = configuredClientId && !configuredClientId.includes('YOUR_GOOGLE_CLIENT_ID');

    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      ...(hasClientId ? { audience: configuredClientId } : {}),
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      return res.status(401).json({ success: false, message: 'Invalid Google token payload' });
    }

    const userId = `google_${payload.sub}`;
    const user = getOrCreateUser(userId, {
      name: payload.name || profile.name,
      email: payload.email,
      avatar: payload.picture || profile.avatar,
      google_id: payload.sub,
    });
    user.name = payload.name || profile.name || user.name || 'Google User';
    user.email = payload.email;
    user.avatar = payload.picture || profile.avatar || user.avatar || '';
    user.google_id = payload.sub;

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: safeUser(user),
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `Google authentication failed: ${error.message}`,
    });
  }
};

// @desc    Register is disabled (Google only)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Email/password signup is disabled. Use Google Sign-In.',
  });
};

// @desc    Login is disabled (Google only)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Email/password login is disabled. Use Google Sign-In.',
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  const user = users.find((item) => item._id === req.user._id);
  if (!user || user._id === 'demo-user') {
    return res.status(401).json({ success: false, message: 'Session invalid. Please sign in with Google again.' });
  }
  return res.json({ success: true, user: safeUser(user) });
};

// @desc    Update user profile (skills, etc.)
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  const user = users.find((item) => item._id === req.user._id);
  if (!user || user._id === 'demo-user') {
    return res.status(401).json({ success: false, message: 'Session invalid. Please sign in with Google again.' });
  }
  const { name, skills } = req.body;
  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (Array.isArray(skills)) user.skills = skills;

  return res.json({ success: true, user: safeUser(user) });
};

module.exports = { signup, login, googleAuth, getMe, updateProfile };
