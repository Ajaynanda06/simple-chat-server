const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
let clients = [];

wss.on('connection', ws => {
  if (clients.length >= 2) {
    ws.send(JSON.stringify({ type: 'error', message: 'Chat room is full.' }));
    return ws.close();
  }

  const clientId = clients.length + 1;
  const metadata = { id: `User ${clientId}`, ws: ws };
  clients.push(metadata);

  console.log(`Client ${metadata.id} connected.`);
  ws.send(JSON.stringify({ type: 'info', message: `You are ${metadata.id}` }));

  broadcast({
    type: 'status',
    message: `${metadata.id} has joined the chat.`
  }, ws);

  ws.on('message', message => {
    const broadcastMessage = {
      type: 'message',
      sender: metadata.id,
      text: message.toString(),
    };
    broadcast(broadcastMessage, ws);
  });

  ws.on('close', () => {
    clients = clients.filter(client => client.ws !== ws);
    console.log(`Client ${metadata.id} disconnected.`);
    broadcast({
      type: 'status',
      message: `${metadata.id} has left the chat.`
    });
  });
});

function broadcast(data, senderWs) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== senderWs) {
      client.ws.send(message);
    }
  });
}

console.log('WebSocket server is running!');
