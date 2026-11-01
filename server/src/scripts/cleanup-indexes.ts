import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function cleanup() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('sessions');

    // Get all indexes on sessions collection
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach((idx) => {
      console.log(`  - ${JSON.stringify(idx)}`);
    });

    // Find and drop duplicate 2dsphere indexes, keep only one
    let geoIndexCount = 0;
    for (const idx of indexes) {
      const key = idx.key;
      const isGeo = Object.values(key).includes('2dsphere');

      if (isGeo) {
        geoIndexCount++;
        if (geoIndexCount > 1) {
          const indexName = idx.name;
          if (indexName) {
            console.log(`Dropping duplicate geospatial index: ${indexName}`);
            await collection.dropIndex(indexName);
          }
        } else {
          console.log(`Keeping geospatial index: ${idx.name}`);
        }
      }
    }

    console.log('Cleanup complete');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Cleanup error:', err);
    process.exit(1);
  }
}

cleanup();
