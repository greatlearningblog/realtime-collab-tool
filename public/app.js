const socket = io();

// DOM elements
const editor = document.getElementById('editor');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// Send document changes as the user types
editor.addEventListener('input', () => {
  const content = editor.value;
  socket.emit('document change', content);
});

// Listen for document updates from the server
socket.on('document update', (newContent) => {
  // Update the editor content. In a real application, you might want to merge changes.
  editor.value = newContent;
});

// Handle chat message submissions
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = chatInput.value;
  if (message) {
    appendChatMessage('You', message);
    socket.emit('chat message', message);
    chatInput.value = '';
  }
});

// Listen for incoming chat messages
socket.on('chat message', (data) => {
  // data: { sender, message }
  appendChatMessage(data.sender, data.message);
});

function appendChatMessage(sender, message) {
  const messageElem = document.createElement('div');
  messageElem.textContent = sender + ': ' + message;
  chatBox.appendChild(messageElem);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Optional: Basic live cursor tracking
editor.addEventListener('mousemove', (e) => {
  const position = { x: e.offsetX, y: e.offsetY };
  socket.emit('cursor move', position);
});

socket.on('cursor update', (data) => {
  // For demo purposes, log the cursor positions.
  console.log('Cursor update from', data.sender, data.position);
});
