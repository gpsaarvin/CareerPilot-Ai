// ============================================================
// Auth Middleware
// Verifies app JWT and attaches user to request
// ============================================================
const jwt = require('jsonwebtoken');
const { users, getOrCreateUser } = require('../data/inMemoryStore');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-this');
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token payload' });
    }

    if (decoded.id === 'demo-user') {
      return res.status(401).json({ success: false, message: 'Legacy session detected. Please sign in with Google again.' });
    }

    let user = users.find((item) => item._id === decoded.id);
    if (!user && decoded.id.startsWith('google_')) {
      user = getOrCreateUser(decoded.id, {
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.avatar,
        google_id: decoded.google_id,
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
