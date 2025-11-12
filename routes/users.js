import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('email full_name role phone created_at')
      .lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: req.user.id, ...user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/patients', authenticateToken, authorizeRole('doctor'), async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('email full_name phone created_at')
      .sort({ created_at: -1 })
      .lean();
    res.json(
      patients.map((p) => ({
        id: p._id,
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        created_at: p.created_at
      }))
    );
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/doctor', authenticateToken, async (req, res) => {
  try {
    const doctor = await User.findOne({ role: 'doctor' })
      .select('email full_name phone')
      .lean();

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ id: doctor._id, ...doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

export default router;
