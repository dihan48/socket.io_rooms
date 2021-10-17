import path from "path";
import http from "http";
import express from "express";
import { Server } from "socket.io";
import User from "./user.js";

const app = express();
app.use(express.static(path.join(path.resolve(), "./client")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
User.io = io;

const rooms = new Set();
for (let i = 0; i < 10; i++) {
  rooms.add(`room_${i}`);
}

const connectSessions = new Set();

io.on("connection", (socket) => {
  const { token } = socket.handshake.auth;
  let { sessionId } = socket.handshake.auth;

  console.log(`[${socket.id}] connected`);

  let user = token ? User.all.get(token) : null;
  if (user) {
    // console.log(`[${socket.id}] user is found in the system`);
    user.connect(socket);
  } else {
    if (connectSessions.has(sessionId)) {
      console.log(`[${socket.id}] disconnected`);
      return socket.disconnect();
    }

    connectSessions.add(sessionId);
    user = new User(socket);
    io.in(user.token).emit("saveToken", user.token);
  }

  io.emit("online", User.getOnline().size);

  socket.on("disconnect", (reason) => {
    // console.log(`[${socket.id}] user disconnected: ${reason}`);
    user.disconnect(socket);
    io.emit("online", User.getOnline().size);
  });

  socket.on("savedToken", (newSessionId) => {
    setTimeout(() => connectSessions.delete(sessionId), 5000);
  });

  socket.on("getAllRooms", () => {
    // console.log("getAllRooms");
    io.in(user.token).emit("allRooms", JSON.stringify([...rooms]));
  });

  socket.on("getUserRooms", () => {
    io.in(user.token).emit("getUserRooms", JSON.stringify([...user.rooms]));
  });

  socket.on("joinRoom", (room, join) => {
    // console.log(`[${socket.id}] joinRoom `, room, join);
    if (rooms.has(room)) {
      if (join) {
        user.join(room);
      } else {
        user.leave(room);
      }
      // console.log(`[${socket.id}] user.rooms `, user.rooms);
      io.in(user.token).emit("getUserRooms", JSON.stringify([...user.rooms]));
    }
  });
});

// setInterval(() => {
//   rooms.forEach((room) => {
//     io.to(room).emit("msg", `you in ${room}`);
//   });
// }, 1000);

server.listen(8080, () => {
  console.log("server started");
});
