import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, index: true },
		password: { type: String, required: true },
		full_name: { type: String, required: true },
		role: {
			type: String,
			required: true,
			enum: ['patient', 'doctor', 'medicine_company']
		},
		phone: { type: String }
	},
	{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const User = mongoose.model('User', UserSchema);


