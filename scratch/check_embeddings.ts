import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Landmark from '../models/Landmark';


dotenv.config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const count = await Landmark.countDocuments();
  const embedCount = await Landmark.countDocuments({ embedding: { $exists: true, $not: { $size: 0 } } });
  console.log('Total Landmarks:', count);
  console.log('With Embeddings:', embedCount);
  process.exit(0);
}

check();
