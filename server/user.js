import { randomBytes } from "crypto";

export default class User {
  static all = new Map();
  static online = new Set();
  static onlineSockets = new Map();

  constructor(io, socket) {
    this.sockets = new Set([socket]);
    this.rooms = new Set();
    this.token = randomBytes(48).toString("hex");
    socket.join(this.token);
    User.all.set(this.token, this);
    User.onlineSockets.set(socket, this);
    this.updateOnline(io);

    console.log(
      "\x1b[36m%s\x1b[0m",
      `user has been created with token \n ${this.token}`
    );
  }

  static tokenToUser = (token) => (token ? User.all.get(token) : null);
  static socketToUser = (socket) => User.all.get(socket);
  static getOnline = () => new Set(User.onlineSockets.values());

  disconnect(io, socket) {
    this.updateRooms(io, [...this.rooms]);
    this.sockets.delete(socket);
    User.onlineSockets.delete(socket);
    this.updateOnline(io);
  }

  async connect(io, socket) {
    this.sockets.add(socket);
    User.onlineSockets.set(socket, this);
    await socket.join([this.token, ...this.rooms]);
    this.updateRooms(io, [...this.rooms]);
    this.updateOnline(io);
  }

  async join(io, room, callback) {
    this.rooms.add(room);
    await io.in(this.token).socketsJoin(room);
    this.updateRooms(io, [room]);
    callback?.();
  }

  async leave(io, room, callback) {
    await io.in(this.token).socketsLeave(room);
    this.updateRooms(io, [room]);
    this.rooms.delete(room);
    callback?.();
  }

  updateOnline(io) {
    io.emit("online", User.getOnline().size);
  }

  updateRooms(io, rooms) {
    rooms.forEach(async (room) => {
      const sockets = await io.in(room).fetchSockets();
      const usersInRoom = new Set();
      for (let socket of sockets) {
        const user = User.onlineSockets.get(socket);
        usersInRoom.add(user);
      }
      const data = JSON.stringify({
        name: room,
        socketCount: sockets.length,
        usersCount: usersInRoom.size,
      });

      io.in(room).emit("updateRoom", data);
    });
  }
}
