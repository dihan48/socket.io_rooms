import Head from "next/head";
import useSocket from "../components/useSocket";
import useSocketRooms from "../components/useSocketRooms";

import styles from "../styles/Home.module.css";

export default function Home() {
  const [socket, status] = useSocket("", {
    path: "/api/socketio",
  });
  const [online, allRooms, userRoomsInfo, userRooms, joinRoom, leaveRoom] =
    useSocketRooms(socket);

  return (
    <>
      <Head>
        <title>Socket</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <main>
        <h1>Socket status: {status}</h1>
        {socket?.connected && (
          <>
            <h3>Online: {online}</h3>
            <div>
              {allRooms.map((room) => (
                <Button
                  key={room}
                  room={room}
                  isJoined={userRooms.has(room)}
                  roomInfo={userRoomsInfo.get(room)}
                  leaveRoom={leaveRoom}
                  joinRoom={joinRoom}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function Button({ room, isJoined, roomInfo, leaveRoom, joinRoom }) {
  return (
    <button
      key={room}
      onClick={() => (isJoined ? leaveRoom(room) : joinRoom(room))}
    >
      <h5>{isJoined ? "Leave" : "Join"}</h5>
      <h4>{room}</h4>
      {isJoined && roomInfo && (
        <>
          <h6>sockets: {roomInfo.socketCount}</h6>
          <h6>users: {roomInfo.usersCount}</h6>
        </>
      )}
    </button>
  );
}
