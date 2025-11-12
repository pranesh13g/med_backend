import mongoose from 'mongoose';

const MedicineRequestSchema = new mongoose.Schema(
	{
		patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		medicine_name: { type: String, required: true },
		reason: { type: String, required: true },
		status: {
			type: String,
			required: true,
			enum: ['pending', 'approved', 'rejected', 'delivered', 'processing'],
			default: 'pending',
			index: true
		},
		doctor_notes: { type: String }
	},
	{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const MedicineRequest = mongoose.model('MedicineRequest', MedicineRequestSchema);


