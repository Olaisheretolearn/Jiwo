
// central WebSocket hub for sessions

const sessionSockets = new Map(); 

function registerSessionWs(app) {
  app.ws('/ws/sessions/:id', (ws, req) => {
    const sessionId = req.params.id;
    const role = (req.query.role || 'viewer').toLowerCase();

    if (!sessionSockets.has(sessionId)) {
      sessionSockets.set(sessionId, new Set());
    }

    const clients = sessionSockets.get(sessionId);
    const clientInfo = { ws, role };
    clients.add(clientInfo);

   //broadcaster
    const broadcast = (payload) => {
      const message = JSON.stringify(payload);
      for (const c of clients) {
        if (c.ws.readyState === 1) {
          c.ws.send(message);
        }
      }
    };

    // broadcasting live viewer count
    const sendViewerCount = () => {
      const viewerCount = Array.from(clients).filter(
        (c) => c.role === 'viewer' && c.ws.readyState === 1
      ).length;

      broadcast({ type: 'viewerCount', viewerCount });
    };

    sendViewerCount();

    ws.on('message', (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch {
        return;
      }

      
      if (data.type === 'noteUpdate') {
        for (const c of clients) {
          if (c.ws !== ws && c.ws.readyState === 1) {
            c.ws.send(
              JSON.stringify({
                type: 'noteUpdate',
                text: data.text,
              })
            );
          }
        }
      }
    });

    ws.on('close', () => {
      clients.delete(clientInfo);
      if (clients.size === 0) {
        sessionSockets.delete(sessionId);
      } else {
        sendViewerCount();
      }
    });
  });
}


function broadcastToSession(sessionId, payload) {
  const clients = sessionSockets.get(sessionId);
  if (!clients) return;

  const message = JSON.stringify(payload);
  for (const c of clients) {
    if (c.ws.readyState === 1) {
      c.ws.send(message);
    }
  }
}

module.exports = {
  registerSessionWs,
  broadcastToSession,
};
