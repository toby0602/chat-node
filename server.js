const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// 創建 Express 應用程式
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 用於儲存連接的映射
const clients = new Map();

function broadcast(message) {
  clients.forEach((_, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// WebSocket 處理函數
wss.on('connection', (ws, req) => {
  const id = new URL(req.url, `http://${req.headers.host}`).searchParams.get('id');
  clients.set(ws, id);

  // 通知其他用戶新用戶加入
  const joinMessage = JSON.stringify({ event: 'other', name: id, content: '加入聊天室' });
  broadcast(joinMessage);

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    broadcast(JSON.stringify(message));
  });

  ws.on('close', () => {
    clients.delete(ws);
    const leaveMessage = JSON.stringify({ event: 'other', name: id, content: '離開聊天室' });
    broadcast(leaveMessage);
  });
});

// 設置靜態文件目錄
app.use('/assets', express.static(path.join(__dirname, 'template/assets')));

// 設置首頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'template/html/index.html'));
});

// 運行伺服器
server.listen(5001, () => {
  console.log('伺服器運行於 http://localhost:5001');
});
