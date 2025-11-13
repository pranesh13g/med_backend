import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chats.js';
import medicineRoutes from './routes/medicines.js';
import { connectDatabase } from './config/db.js';
import { Message } from './models/Message.js';
import { Chat } from './models/Chat.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Allow multiple frontends (local + production)
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://med-frontend-eta.vercel.app'];
const envOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : []),
].filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const io = new Server(httpServer, {
	cors: {
		origin: allowedOrigins,
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

await connectDatabase();

app.set('trust proxy', 1);
app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	})
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/medicines', medicineRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MedConnect API is running' });
});

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on('send_message', async (data) => {
    const { chatId, senderId, content } = data;

    try {
      const msgDoc = await Message.create({
        chat_id: chatId,
        sender_id: senderId,
        content
      });
      await Chat.findByIdAndUpdate(chatId, { updated_at: new Date() });
      const populated = await msgDoc.populate({ path: 'sender_id', select: 'full_name role' });
      io.to(chatId).emit('new_message', {
        id: populated._id,
        content: populated.content,
        created_at: populated.created_at,
        sender: {
          id: populated.sender_id._id,
          full_name: populated.sender_id.full_name,
          role: populated.sender_id.role
        }
      });
    } catch (error) {
      console.error('Socket send message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(chatId).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`MedConnect API server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});
