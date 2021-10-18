export default function registerUserHandlers(
  io,
  socket,
  user,
  rooms,
  connectSessions,
  sessionId
) {
  const onDisconnect = (reason) => {
    console.log(`[${socket.id}] disconnect: "${reason}"`);
    user.disconnect(io, socket);
  };

  const saveToken = () => {
    setTimeout(() => connectSessions.delete(sessionId), 5000);
  };

  const sendAllRoomsData = () => {
    io.in(user.token).emit("allRooms", JSON.stringify([...rooms]));
  };

  const sendUserRoomsData = () => {
    io.in(user.token).emit("getUserRooms", JSON.stringify([...user.rooms]));
  };

  const joinRoom = (room) => {
    if (rooms.has(room)) {
      user.join(io, room, sendUserRoomsData);
    }
  };

  const leaveRoom = (room) => {
    if (rooms.has(room)) {
      user.leave(io, room, sendUserRoomsData);
    }
  };

  socket.on("disconnect", onDisconnect);
  socket.on("savedToken", saveToken);
  socket.on("getAllRooms", sendAllRoomsData);
  socket.on("getUserRooms", sendUserRoomsData);
  socket.on("joinRoom", joinRoom);
  socket.on("leaveRoom", leaveRoom);
}
