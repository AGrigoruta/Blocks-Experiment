import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

console.log('Simple connection test...');

const client = io(SERVER_URL, { 
  transports: ['websocket'],
  timeout: 5000
});

client.on('connect', () => {
  console.log('✅ Connected successfully!', client.id);
  client.disconnect();
  process.exit(0);
});

client.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Connection timed out');
  process.exit(1);
}, 6000);
