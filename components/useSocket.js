import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
export default function useSocket(setSocket, setSocketStatus) {
  const socketRef = useRef();
  const [rooms, setRooms] = useState();
  useEffect(() => {
    socketRef.current = io("ws://localhost:8080");

    socketRef.current.io.on("reconnect_attempt", () => {
      console.log(`[socket] attempt reconnect`);
    });

    socketRef.current.io.on("reconnect", () => {
      console.log(`[socket] reconnect`);
    });

    socketRef.current.on("connect", () => {
      setSocketStatus?.("connected");
      console.log(`[socket] connect ${socketRef.current.id}`);
      socket.emit("getRooms");
      socket.on("getRooms", (data) => {
        console.log(`[getRooms] `, data)
        const rooms = JSON.parse(data);
        if (Array.isArray(rooms)) {
          setRooms(rooms);
        }
      });
    });

    socketRef.current.on("disconnect", (reason) => {
      setSocketStatus?.(reason);
      if (reason === "io server disconnect") {
        socket.connect();
      }
      console.log(`[socket] disconnect: ${reason}`);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error(error);
    });

    setSocket(socketRef.current);

    return () => {
      console.log("[socket] client closed connection");
      socketRef.current.disconnect();
    };
  }, []);
}
