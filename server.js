const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// MongoDB 연결 설정
mongoose.connect('mongodb://localhost:27017/chat-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// 메시지 스키마 및 모델 설정
const messageSchema = new mongoose.Schema({
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// 정적 파일 및 기본 라우팅
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 소켓 연결 및 이벤트 설정
io.on('connection', async (socket) => {
  console.log('A user connected');

  // 기존 메시지를 클라이언트로 전송
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    messages.forEach((message) => {
      socket.emit('chat message', message.text);
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
  }

  // 새로운 메시지 저장 및 방송
  socket.on('chat message', async (msg) => {
    try {
      const message = new Message({ text: msg });
      await message.save();
      io.emit('chat message', msg); // 모든 클라이언트에 메시지 전송
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// 서버 실행
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

