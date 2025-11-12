import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema(
	{
		patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
	},
	{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

ChatSchema.index({ patient_id: 1, doctor_id: 1 }, { unique: true });

export const Chat = mongoose.model('Chat', ChatSchema);


