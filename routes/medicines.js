import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { MedicineRequest } from '../models/MedicineRequest.js';
import { User } from '../models/User.js';

const router = express.Router();

router.post('/request', authenticateToken, authorizeRole('patient'), async (req, res) => {
  try {
    const { doctor_id, medicine_name, reason } = req.body;

    if (!doctor_id || !medicine_name || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const requestDoc = await MedicineRequest.create({
      patient_id: req.user.id,
      doctor_id,
      medicine_name,
      reason,
      status: 'pending'
    });
    const patient = await User.findById(req.user.id).select('full_name email phone').lean();
    const doctor = await User.findById(doctor_id).select('full_name email').lean();
    res.status(201).json({
      id: requestDoc._id,
      medicine_name,
      reason,
      status: requestDoc.status,
      doctor_notes: requestDoc.doctor_notes,
      created_at: requestDoc.created_at,
      updated_at: requestDoc.updated_at,
      patient: { id: patient?._id, full_name: patient?.full_name, email: patient?.email, phone: patient?.phone },
      doctor: { id: doctor?._id, full_name: doctor?.full_name, email: doctor?.email }
    });
  } catch (error) {
    console.error('Create medicine request error:', error);
    res.status(500).json({ error: 'Failed to create medicine request' });
  }
});

router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const filter =
      req.user.role === 'patient'
        ? { patient_id: req.user.id }
        : req.user.role === 'doctor'
        ? { doctor_id: req.user.id }
        : {};

    const requests = await MedicineRequest.find(filter)
      .sort({ created_at: -1 })
      .populate('patient_id', 'full_name email phone')
      .populate('doctor_id', 'full_name email')
      .lean();

    res.json(
      requests.map((r) => ({
        id: r._id,
        medicine_name: r.medicine_name,
        reason: r.reason,
        status: r.status,
        doctor_notes: r.doctor_notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
        patient: r.patient_id
          ? { id: r.patient_id._id, full_name: r.patient_id.full_name, email: r.patient_id.email, phone: r.patient_id.phone }
          : undefined,
        doctor: r.doctor_id
          ? { id: r.doctor_id._id, full_name: r.doctor_id.full_name, email: r.doctor_id.email }
          : undefined
      }))
    );
  } catch (error) {
    console.error('Get medicine requests error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine requests' });
  }
});

router.get('/prescriptions', authenticateToken, authorizeRole('medicine_company'), async (req, res) => {
  try {
    const allowedStatuses = ['approved', 'processing', 'delivered'];
    const prescriptions = await MedicineRequest.find({ status: { $in: allowedStatuses } })
      .sort({ updated_at: -1 })
      .populate('patient_id', 'full_name email phone')
      .populate('doctor_id', 'full_name email')
      .lean();

    res.json(
      prescriptions.map((r) => ({
        id: r._id,
        medicine_name: r.medicine_name,
        reason: r.reason,
        status: r.status,
        doctor_notes: r.doctor_notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
        patient: { id: r.patient_id._id, full_name: r.patient_id.full_name, email: r.patient_id.email, phone: r.patient_id.phone },
        doctor: { id: r.doctor_id._id, full_name: r.doctor_id.full_name, email: r.doctor_id.email }
      }))
    );
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

router.patch('/requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, doctor_notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'delivered', 'processing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (req.user.role === 'doctor' && !['approved', 'rejected'].includes(status)) {
      return res.status(403).json({ error: 'Doctors can only approve or reject requests' });
    }

    if (req.user.role === 'medicine_company' && !['processing', 'delivered'].includes(status)) {
      return res.status(403).json({ error: 'Medicine company can only update to processing or delivered' });
    }

    if (req.user.role === 'patient') {
      return res.status(403).json({ error: 'Patients cannot update request status' });
    }

    const updateData = { status };
    if (doctor_notes && req.user.role === 'doctor') {
      updateData.doctor_notes = doctor_notes;
    }

    const updated = await MedicineRequest.findByIdAndUpdate(
      requestId,
      { $set: updateData },
      { new: true }
    )
      .populate('patient_id', 'full_name email phone')
      .populate('doctor_id', 'full_name email')
      .lean();

    if (!updated) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({
      id: updated._id,
      medicine_name: updated.medicine_name,
      reason: updated.reason,
      status: updated.status,
      doctor_notes: updated.doctor_notes,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      patient: { id: updated.patient_id._id, full_name: updated.patient_id.full_name, email: updated.patient_id.email, phone: updated.patient_id.phone },
      doctor: { id: updated.doctor_id._id, full_name: updated.doctor_id.full_name, email: updated.doctor_id.email }
    });
  } catch (error) {
    console.error('Update medicine request error:', error);
    res.status(500).json({ error: 'Failed to update medicine request' });
  }
});

export default router;
