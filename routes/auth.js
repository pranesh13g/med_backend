import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['patient', 'doctor', 'medicine_company'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email }).select('_id').lean();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userDoc = await User.create({
      email,
      password: hashedPassword,
      full_name,
      role,
      phone: phone || null,
    });

    const token = jwt.sign(
      { id: userDoc._id.toString(), email: userDoc.email, role: userDoc.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = userDoc.toObject();
    const { password: _, ...userWithoutPassword } = { ...userObj, id: userObj._id };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, userDoc.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: userDoc._id.toString(), email: userDoc.email, role: userDoc.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = userDoc.toObject();
    const { password: _, ...userWithoutPassword } = { ...userObj, id: userObj._id };

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
