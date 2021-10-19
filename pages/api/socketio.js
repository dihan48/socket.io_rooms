import SocketServer from "../../server/io.js";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("New Socket.io server...");
    const httpServer = res.socket.server;
    const io = new SocketServer(httpServer, {
      path: "/api/socketio",
    });
    res.socket.server.io = io;
  }
  res.end();
}
