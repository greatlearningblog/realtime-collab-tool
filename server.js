require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');

// Initialize Firebase Admin with service account credentials
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public folder
app.use(express.static('public'));

// For demonstration, we use a single shared document with a fixed ID.
const DOCUMENT_ID = 'default-document';

// Function to update document content in Firestore
async function updateDocument(content) {
  try {
    const docRef = db.collection('documents').doc(DOCUMENT_ID);
    await docRef.set({ content, updatedAt: new Date() });
  } catch (error) {
    console.error('Error updating document in Firestore:', error);
  }
}

// Socket.io event handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // All clients join the same room for the shared document
  socket.join(DOCUMENT_ID);

  // Listen for document changes
  socket.on('document change', (newContent) => {
    console.log('Document changed by', socket.id);
    // Broadcast the update to other clients in the room
    socket.to(DOCUMENT_ID).emit('document update', newContent);
    // Persist changes to Firestore
    updateDocument(newContent);
  });

  // Listen for chat messages
  socket.on('chat message', (msg) => {
    console.log('Chat message from', socket.id, msg);
    io.to(DOCUMENT_ID).emit('chat message', { sender: socket.id, message: msg });
  });

  // Listen for cursor movements (basic live cursor tracking)
  socket.on('cursor move', (data) => {
    // Data should include the cursor position
    socket.to(DOCUMENT_ID).emit('cursor update', { sender: socket.id, position: data });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.to(DOCUMENT_ID).emit('user disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
