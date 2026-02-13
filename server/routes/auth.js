const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, run } = require('../database/database');

const router = express.Router();
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    // نخزن المستخدم في الريكوست
    req.user = decoded;

    const dbUser = await queryOne(
      "SELECT role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }

    if (dbUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access only" });
    }

    next();

  } catch (err) {
    console.error("verifyAdmin error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};


// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'analyst' } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.id,
        username,
        email,
        role
      }
    });
 } catch (error) {
  console.error('🔥 REG ERROR FULL:', error);
  res.status(500).json({ error: 'Failed to register user', details: error.message });
}

});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const user = await queryOne(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await queryOne(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get all users (admin only)
router.get('/users', verifyAdmin, async (req, res) => {

  try {
    const users = await query(
      'SELECT id, username, email, role, created_at, is_active FROM users ORDER BY created_at DESC'
    );
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === 1) {
    return res.status(403).json({ error: "Main admin cannot be deleted" });
  }

  await run('DELETE FROM users WHERE id=?', [userId]);
  res.json({ success: true });
});
router.put('/users/:id/role', verifyAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === 1) {
    return res.status(403).json({ error: "Main admin role cannot be changed" });
  }

  await run('UPDATE users SET role=? WHERE id=?', [req.body.role, userId]);
  res.json({ success: true });
});
router.put('/users/:id/status', verifyAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === 1) {
    return res.status(403).json({ error: "Main admin cannot be disabled" });
  }

  await run('UPDATE users SET is_active=? WHERE id=?', [req.body.is_active, userId]);
  res.json({ success: true });
});

module.exports = router; 