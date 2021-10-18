import { Server } from "socket.io";
import User from "./user.js";
import registerUserHandlers from "./userHandlers.js";

export default class SocketServer {
  defaultOptions = {
    cors: {
      origin: "*",
    },
  };

  rooms = new Set();
  connectSessions = new Set();

  constructor(httpServer, options = this.defaultOptions) {
    for (let i = 0; i < 10; i++) {
      this.rooms.add(`room_${i}`);
    }
    const io = new Server(httpServer, options);
    this.io = io;
    io.on("connection", this.onConnect(io));
  }

  onConnect = (io) => (socket) => {
    console.log(`[${socket.id}] connected`);

    let { token, sessionId } = socket.handshake.auth;
    let user = User.tokenToUser(token);
    if (user) {
      user.connect(io, socket);
    } else {
      if (this.connectSessions.has(sessionId)) {
        return socket.disconnect();
      }
      this.connectSessions.add(sessionId);
      user = new User(io, socket);
      io.in(user.token).emit("saveToken", user.token);
    }

    registerUserHandlers(
      io,
      socket,
      user,
      this.rooms,
      this.connectSessions,
      sessionId
    );
  };
}
