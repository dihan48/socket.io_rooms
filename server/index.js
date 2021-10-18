import path from "path";
import http from "http";
import express from "express";
import SocketServer from "./io.js";

const app = express();
app.use(express.static(path.join(path.resolve(), "./client")));
const server = http.createServer(app);
server.listen(8080, () => console.log("server started"));

const io = new SocketServer(server);
