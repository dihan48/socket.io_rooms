import { useEffect, useRef, useState } from "react";
import { setCookie } from "./cookie";

export default function useSocketRooms(socket) {
  const allRoomsDataRef = useRef([]);
  const [allRooms, setAllRooms] = useState([]);
  const [userRoomsInfo, setUserRoomsInfo] = useState(new Map());
  const [userRooms, setUserRooms] = useState(new Set());
  const [online, setOnline] = useState(0);

  useEffect(() => {
    if (socket) {
      socket.on("saveToken", onSaveToken);
      socket.on("getUserRooms", onGetUserRooms);
      socket.on("updateRoom", onUpdateRoom);
      socket.on("allRooms", onGetAllRooms);
      socket.on("online", onGetOnline);
    }
  }, [socket]);

  function onSaveToken(token) {
    setCookie("token", token, { secure: true, "max-age": 3600 });
    socket.emit("savedToken");
  }

  function onGetUserRooms(data) {
    const rooms = JSON.parse(data);
    if (Array.isArray(rooms)) {
      const userRooms = new Set(rooms);
      setUserRooms(userRooms);
    }
  }

  function onGetAllRooms(data) {
    const rooms = JSON.parse(data);
    if (Array.isArray(rooms)) {
      setAllRooms(rooms);
    }
  }

  function onUpdateRoom(data) {
    const info = JSON.parse(data);
    allRoomsDataRef.current.push(info);
    const newAllRoomsInfo = new Map();
    allRoomsDataRef.current.forEach((item) => {
      newAllRoomsInfo.set(item.name, item);
    });
    allRoomsDataRef.current = [...newAllRoomsInfo.values()];
    setUserRoomsInfo(newAllRoomsInfo);
  }

  function onGetOnline(online) {
    console.log(`Online: ${online}`);
    setOnline(online);
  }

  function joinRoom(room) {
    socket.emit("joinRoom", room);
  }

  function leaveRoom(room) {
    socket.emit("leaveRoom", room);
  }

  return [online, allRooms, userRoomsInfo, userRooms, joinRoom, leaveRoom];
}
