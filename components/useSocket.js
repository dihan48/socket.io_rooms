import { useEffect, useState } from "react";
import io from "socket.io-client";
import { getCookie } from "./cookie";

export default function useSocket(url) {
  const [socket, setSocket] = useState();
  const [status, setStatus] = useState("disconnect");

  useEffect(() => {
    let sessionId = localStorage.getItem("session");
    if (sessionId == false) {
      sessionId = randomBytes(48).toString("hex");
      localStorage.setItem("session", sessionId);
    }

    const socket = io(url, {
      auth: {
        token: getCookie("token"),
        sessionId,
      },
    });

    setSocket(socket);

    return () => {
      console.log("[socket] client closed connection");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);
      socket.io.on("reconnect_attempt", onReconnectAttempt);
      socket.io.on("reconnect", onReconnect);
    }
  }, [socket]);

  function onConnect() {
    setStatus("connected");
    console.log(`[socket] connect ${socket.id}`);
    socket.emit("getAllRooms");
    socket.emit("getUserRooms");
  }

  function onDisconnect(reason) {
    setStatus(reason);
    if (reason === "io server disconnect") {
      socket.auth = {
        token: getCookie("token"),
        sessionId,
      };
      socket.connect();
    }
    console.log(`[socket] disconnect: ${reason}`);
  }

  function onConnectError(error) {
    console.error(error);
  }

  function onReconnectAttempt() {
    console.log(`[socket] attempt reconnect`);
  }

  function onReconnect() {
    console.log(`[socket] reconnect`);
  }

  return [socket, status];
}
