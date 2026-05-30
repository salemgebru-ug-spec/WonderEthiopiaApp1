const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const count = await db.collection('landmarks').countDocuments();
  const embedCount = await db.collection('landmarks').countDocuments({ embedding: { $exists: true, $not: { $size: 0 } } });
  console.log('Total Landmarks:', count);
  console.log('With Embeddings:', embedCount);
  await client.close();
}

check();
