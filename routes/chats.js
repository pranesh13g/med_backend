import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { doctor_id } = req.body;
    const patient_id = req.user.id;

    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can create chats' });
    }

    let existingChat = await Chat.findOne({ patient_id, doctor_id }).lean();

    if (existingChat) {
      return res.json({ ...existingChat, id: existingChat._id });
    }

    const chatDoc = await Chat.create({ patient_id, doctor_id });

    res.status(201).json({ id: chatDoc._id, patient_id, doctor_id, created_at: chatDoc.created_at, updated_at: chatDoc.updated_at });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const filter =
      req.user.role === 'patient'
        ? { patient_id: req.user.id }
        : req.user.role === 'doctor'
        ? { doctor_id: req.user.id }
        : {};

    const chats = await Chat.find(filter)
      .sort({ updated_at: -1 })
      .populate('patient_id', 'full_name email')
      .populate('doctor_id', 'full_name email')
      .lean();

    res.json(
      chats.map((c) => ({
        id: c._id,
        patient: { id: c.patient_id._id, full_name: c.patient_id.full_name, email: c.patient_id.email },
        doctor: { id: c.doctor_id._id, full_name: c.doctor_id.full_name, email: c.doctor_id.email },
        created_at: c.created_at,
        updated_at: c.updated_at
      }))
    );
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId).lean();

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (String(chat.patient_id) !== req.user.id && String(chat.doctor_id) !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = await Message.find({ chat_id: chatId })
      .sort({ created_at: 1 })
      .populate('sender_id', 'full_name role')
      .lean();

    res.json(
      messages.map((m) => ({
        id: m._id,
        content: m.content,
        created_at: m.created_at,
        sender: { id: m.sender_id._id, full_name: m.sender_id.full_name, role: m.sender_id.role }
      }))
    );
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const chat = await Chat.findById(chatId).lean();

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (String(chat.patient_id) !== req.user.id && String(chat.doctor_id) !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messageDoc = await Message.create({
      chat_id: chatId,
      sender_id: req.user.id,
      content
    });
    await Chat.findByIdAndUpdate(chatId, { updated_at: new Date() });

    const populated = await messageDoc.populate({ path: 'sender_id', select: 'full_name role' });
    res.status(201).json({
      id: populated._id,
      content: populated.content,
      created_at: populated.created_at,
      sender: { id: populated.sender_id._id, full_name: populated.sender_id.full_name, role: populated.sender_id.role }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
