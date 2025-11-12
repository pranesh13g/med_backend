import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

export async function connectDatabase() {
	const mongoUri = process.env.MONGODB_URI || "mongodb+srv://pranesh:b8B9okqgBmoYg6P3@cluster0.dmstinr.mongodb.net/?appName=Cluster0";
	const options = {
		autoIndex: true
	};

	try {
		await mongoose.connect(mongoUri, options);
		console.log('DB Connected to MongoDB');
	} catch (error) {
		console.error('DB MongoDB connection error:', error);
		process.exit(1);
	}
}

export async function pingDatabase() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.warn('DB MONGODB_URI not set; skipping native driver ping.');
		return;
	}

	const client = new MongoClient(uri, {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true
		}
	});

	try {
		await client.connect();
		await client.db('admin').command({ ping: 1 });
		console.log('DB Pinged your deployment. Successfully connected to MongoDB (native driver).');
	} catch (error) {
		console.error('DB Native driver ping failed:', error);
	} finally {
		await client.close();
	}
}


