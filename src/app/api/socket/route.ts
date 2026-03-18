import { NextResponse } from "next/server";
import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return NextResponse.json({ message: "Socket.IO server is running" });
}

// Socket.IO server setup
const SocketHandler = (req: Request, res: any) => {
  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["websocket", "polling"],
    });

    // Store socket server instance
    res.socket.server.io = io;

    // Game state
    let players: any[] = [];
    let bullets: any[] = [];
    let walls: any[] = [
      { id: "wall1", x: 0, y: 0, width: 1000, height: 20 },
      { id: "wall2", x: 0, y: 0, width: 20, height: 1000 },
      { id: "wall3", x: 980, y: 0, width: 20, height: 1000 },
      { id: "wall4", x: 0, y: 980, width: 1000, height: 20 },
    ];

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Send current game state to new player
      socket.emit("state", { players, bullets, walls });
      socket.emit("updatedUserlist", players.length);

      // Handle player joining
      socket.on("game-start", (data) => {
        console.log("Game start:", data);
        const newPlayer = {
          id: socket.id,
          socketId: socket.id,
          nickname: data.nickname || `Player-${socket.id.slice(-4)}`,
          x: 500,
          y: 500,
          width: 40,
          height: 40,
          angle: 0,
          point: 0,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        };

        players.push(newPlayer);

        // Broadcast to all players
        io.emit("state", { players, bullets, walls });
        io.emit("updatedUserlist", players.length);
        io.emit("joiningList", [newPlayer.nickname]);
      });

      // Handle player movement
      socket.on("movement", (movement) => {
        const player = players.find((p) => p.socketId === socket.id);
        if (player) {
          // Update player position based on movement
          const speed = 5;
          if (movement.forward) {
            player.x += speed * Math.cos(player.angle);
            player.y += speed * Math.sin(player.angle);
          }
          if (movement.back) {
            player.x -= speed * Math.cos(player.angle);
            player.y -= speed * Math.sin(player.angle);
          }
          if (movement.left) {
            player.angle += 0.1;
          }
          if (movement.right) {
            player.angle -= 0.1;
          }

          // Keep player in bounds
          player.x = Math.max(50, Math.min(950, player.x));
          player.y = Math.max(50, Math.min(950, player.y));

          // Broadcast updated state
          io.emit("state", { players, bullets, walls });
        }
      });

      // Handle shooting
      socket.on("shoot", () => {
        const player = players.find((p) => p.socketId === socket.id);
        if (player) {
          const newBullet = {
            id: `bullet-${Date.now()}-${Math.random()}`,
            playerId: socket.id,
            x: player.x + 20 * Math.cos(player.angle),
            y: player.y + 20 * Math.sin(player.angle),
            width: 10,
            height: 10,
            velocityX: 10 * Math.cos(player.angle),
            velocityY: 10 * Math.sin(player.angle),
          };

          bullets.push(newBullet);

          // Remove bullet after 3 seconds
          setTimeout(() => {
            bullets = bullets.filter((b) => b.id !== newBullet.id);
            io.emit("state", { players, bullets, walls });
          }, 3000);

          io.emit("state", { players, bullets, walls });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        const player = players.find((p) => p.socketId === socket.id);
        if (player) {
          players = players.filter((p) => p.socketId !== socket.id);
          io.emit("state", { players, bullets, walls });
          io.emit("updatedUserlist", players.length);
          io.emit("updatedPlayerList", player.nickname);
        }
      });
    });

    // Update bullets position
    setInterval(() => {
      bullets.forEach((bullet) => {
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
      });

      // Remove bullets that are out of bounds
      bullets = bullets.filter(
        (bullet) =>
          bullet.x > 0 && bullet.x < 1000 && bullet.y > 0 && bullet.y < 1000,
      );

      io.emit("state", { players, bullets, walls });
    }, 50);
  }
  res.end();
};

export { SocketHandler as GET, SocketHandler as POST };
