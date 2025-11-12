import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
	{
		chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
		sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		content: { type: String, required: true }
	},
	{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Message = mongoose.model('Message', MessageSchema);


