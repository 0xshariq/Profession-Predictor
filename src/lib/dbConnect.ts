import mongoose from 'mongoose';

// Define the shape of our connection object
interface ConnectionObject {
  isConnected: boolean;
}

// Create a connection object to track the connection status
const connection: ConnectionObject = {
  isConnected: false,
};

/**
 * Connects to the MongoDB database
 * @returns {Promise<typeof mongoose>}
 */
async function dbConnect(): Promise<typeof mongoose> {
  // If we're already connected, return the existing connection
  if (connection.isConnected) {
    console.log('Using existing database connection');
    return mongoose;
  }

  // Check if we have a MongoDB URI
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    // Attempt to connect to the database
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    // Update connection status
    connection.isConnected = db.connections[0].readyState === 1;

    if (connection.isConnected) {
      console.log('Successfully connected to DB');
    } else {
      console.log('Failed to establish a stable connection to DB');
    }

    return db;
  } catch (error) {
    console.error('Error connecting to DB:', error);
    throw error;
  }
}

/**
 * Closes the MongoDB connection
 */
async function dbDisconnect() {
  if (!connection.isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    connection.isConnected = false;
    console.log('Disconnected from DB');
  } catch (error) {
    console.error('Error disconnecting from DB:', error);
    throw error;
  }
}

export { dbConnect, dbDisconnect };

