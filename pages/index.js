import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { randomBytes } from "crypto";
import styles from "../styles/Home.module.css";

let updateInfo = (data) => {};

export default function Home() {
  const [socketStatus, setSocketStatus] = useState("disconnect");
  const socketRef = useRef();
  const [allRooms, setAllRooms] = useState([]);
  const allRoomsRef = useRef();
  const setAllRoomsRef = useRef();
  const [allRoomsInfo, setAllRoomsInfo] = useState(new Map());
  const allRoomsInfoRef = useRef();
  const setAllRoomsInfoRef = useRef();
  const [userRooms, setUserRooms] = useState(new Set());
  const userRoomsRef = useRef();
  const setUserRoomsRef = useRef();
  const [online, setOnline] = useState(0);

  const [info, setInfo] = useState([]);

  const allRoomsDataRef = useRef();

  useEffect(() => {
    allRoomsRef.current = allRooms;
    setAllRoomsRef.current = setAllRooms;
    allRoomsInfoRef.current = allRoomsInfo;
    setAllRoomsInfoRef.current = setAllRoomsInfo;
    userRoomsRef.current = userRooms;
    setUserRoomsRef.current = setUserRooms;
  }, [
    allRooms,
    setAllRooms,
    allRoomsInfo,
    setAllRoomsInfo,
    userRooms,
    setUserRooms,
  ]);

  useEffect(() => {
    updateInfo = (data) => {
      console.log(`[updateInfo]`);
      const val = JSON.parse(data);
      info.push(val);
      setInfo(info);
    };
  }, [info, setInfo]);

  useEffect(() => {
    let sessionId = localStorage.getItem("session");
    if (sessionId == false) {
      sessionId = randomBytes(48).toString("hex");
      localStorage.setItem("session", sessionId);
    }

    socketRef.current = io("http://localhost:8080", {
      auth: {
        token: getCookie("token"),
        sessionId,
      },
    });

    socketRef.current.io.on("reconnect_attempt", () => {
      console.log(`[socket] attempt reconnect`);
    });

    socketRef.current.io.on("reconnect", () => {
      console.log(`[socket] reconnect`);
    });

    socketRef.current.on("disconnect", (reason) => {
      setSocketStatus?.(reason);
      if (reason === "io server disconnect") {
        socketRef.current.auth = {
          token: getCookie("token"),
          sessionId,
        };
        socketRef.current.connect();
      }
      console.log(`[socket] disconnect: ${reason}`);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error(error);
    });

    socketRef.current.on("saveToken", (token) => {
      setCookie("token", token, { secure: true, "max-age": 3600 });
      socketRef.current.emit("savedToken");
    });

    socketRef.current.on("getUserRooms", (data) => {
      console.log(`[getUserRooms] `, data);
      const rooms = JSON.parse(data);
      if (Array.isArray(rooms)) {
        const userRooms = new Set(rooms);
        setUserRoomsRef.current(userRooms);
        // console.log(`[getUserRooms Old allRooms] `, allRoomsRef.current);
        const newAllRooms = allRoomsRef.current?.map((room) => ({
          name: room.name,
          join: userRooms.has(room.name),
        }));
        // console.log(`[getUserRooms allRooms] `, newAllRooms);
        setAllRoomsRef.current(newAllRooms);
      }
      if (allRoomsDataRef.current) {
        const newInfo = new Map(allRoomsInfoRef.current);
        for (const info of allRoomsDataRef.current) {
          newInfo.set(info.name, {
            usersCount: info.usersCount,
            socketCount: info.socketCount,
          });
        }
        allRoomsDataRef.current = [];
        setAllRoomsInfoRef.current(newInfo);
      }
    });

    socketRef.current.on("online", (count) => {
      console.log(`Online: ${count}`);
      setOnline(count);
    });

    socketRef.current.on("msg", (msg) => {
      console.log(msg);
    });

    socketRef.current.on("updateRoom", updateInfo);

    socketRef.current.on("updateRoom", (data) => {
      const info = JSON.parse(data);
      if (allRoomsDataRef.current) {
        allRoomsDataRef.current.push(info);
      } else {
        allRoomsDataRef.current = [];
        allRoomsDataRef.current.push(info);
      }
      console.log(
        `[updateRoom] allRoomsDataRef.current : ${allRoomsDataRef.current}`
      );
      if (allRoomsDataRef.current) {
        const newInfo = new Map(allRoomsInfoRef.current);
        for (const info of allRoomsDataRef.current) {
          newInfo.set(info.name, {
            socketCount: info.socketCount,
            usersCount: info.usersCount,
          });
        }
        allRoomsDataRef.current = [];
        setAllRoomsInfoRef.current(newInfo);
      }
      // console.log("[updateRoom] ", data);
      // console.log(`[allRoomsInfoRef.current] ${[...allRoomsInfoRef.current]}`);
      // const newInfo = new Map(allRoomsInfoRef.current);
      // console.log(`[newInfo] ${[...newInfo]}`);
      // allRoomsInfoRef.current.set(info.name, info.ids);
      // newInfo.set(info.name, info.ids);
      // console.log(`[allRoomsInfoRef.current] ${[...allRoomsInfoRef.current]}`);
      // console.log(`[newInfo] ${[...newInfo]}`);
      // setAllRoomsInfoRef.current(newInfo);
    });

    socketRef.current.on("allRooms", (data) => {
      const rooms = JSON.parse(data);
      console.log(`[allRooms data] `, rooms);
      if (Array.isArray(rooms)) {
        const allRooms = rooms.map((room) => ({
          name: room,
          join: userRoomsRef.current?.has(room),
        }));
        // console.log(`[allRooms] `, allRooms);
        setAllRoomsRef.current(allRooms);
      }
    });

    socketRef.current.on("connect", () => {
      setSocketStatus?.("connected");
      console.log(`[socket] connect ${socketRef.current.id}`);
      socketRef.current.emit("getAllRooms");
      socketRef.current.emit("getUserRooms");
    });

    return () => {
      console.log("[socket] client closed connection");
      socketRef.current.disconnect();
    };
  }, []);

  const joinRoom = (room) => {
    socketRef.current?.emit("joinRoom", room);
  };

  const leaveRoom = (room) => {
    socketRef.current?.emit("leaveRoom", room);
  };

  return (
    <>
      <Head>
        <title>Socket</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main>
        <h1>Socket status: {socketStatus}</h1>
        {socketRef.current && socketRef.current.connected && (
          <h3>Online: {online}</h3>
        )}
        {socketRef.current &&
          socketRef.current.connected &&
          allRooms &&
          allRooms.length > 0 && (
            <div>
              {allRooms.map((room) => (
                <button
                  key={room.name}
                  onClick={() =>
                    room.join ? leaveRoom(room.name) : joinRoom(room.name)
                  }
                >
                  <h5>{room.join ? "Leave" : "Join"}</h5>
                  <h4>{room.name}</h4>
                  {room.join && allRoomsInfo?.has(room.name) && (
                    <>
                      <h6>
                        sockets: {allRoomsInfo.get(room.name)?.socketCount}
                      </h6>
                      <h6>users: {allRoomsInfo.get(room.name)?.usersCount}</h6>
                    </>
                  )}
                  
                </button>
              ))}
            </div>
          )}
      </main>
    </>
  );
}

function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {
  options = {
    path: "/",
    // при необходимости добавьте другие значения по умолчанию
    ...options,
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie =
    encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}

function deleteCookie(name) {
  setCookie(name, "", {
    "max-age": -1,
  });
}
