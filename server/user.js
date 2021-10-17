import { randomBytes } from "crypto";

export default class User {
  static io = null;
  static all = new Map();
  static online = new Map();

  constructor(socket, rooms) {
    this.sockets = new Set([socket]);
    this.rooms = rooms instanceof Set ? rooms : new Set();
    this.token = randomBytes(48).toString("hex");
    socket.join(this.token);
    User.all.set(this.token, this);
    User.online.set(socket, this);

    console.log(
      "\x1b[36m%s\x1b[0m",
      `user has been created with token \n ${this.token}`
    );
  }

  static tokenToUser = (token) => User.all.get(token);
  static socketToUser = (socket) => User.all.get(socket);
  static getOnline = () => new Set(User.online.values());

  disconnect(socket) {
    this.rooms.forEach(async (room) => {
      const ids = await User.io.in(room).allSockets();
      User.io
        .in(room)
        .emit("roomInfo", JSON.stringify({ name: room, ids: [...ids] }));
    });
    this.sockets.delete(socket);
    User.online.delete(socket);
  }

  connect(socket) {
    this.sockets.add(socket);
    socket.join([this.token, ...this.rooms]);
    this.rooms.forEach(async (room) => {
      const ids = await User.io.in(room).allSockets();
      User.io
        .in(room)
        .emit("roomInfo", JSON.stringify({ name: room, ids: [...ids] }));
    });
    User.online.set(socket, this);
  }

  async join(room) {
    User.io.in(this.token).socketsJoin(room);
    this.rooms.add(room);

    const ids = await User.io.in(room).allSockets();
    User.io
      .in(room)
      .emit("roomInfo", JSON.stringify({ name: room, ids: [...ids] }));
  }

  async leave(room) {
    User.io.in(this.token).socketsLeave(room);
    this.rooms.delete(room);

    const ids = await User.io.in(room).allSockets();
    User.io
      .in(room)
      .emit("roomInfo", JSON.stringify({ name: room, ids: [...ids] }));
  }
}
