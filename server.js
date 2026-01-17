const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins
app.use(cors());

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store document content for each room
const roomDocuments = new Map();
const roomUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!roomDocuments.has(roomId)) {
      roomDocuments.set(roomId, {
        content: "<p>Start writing your collaborative document...</p>",
        lastModified: Date.now(),
      });
    }

    // Add user to room
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    roomUsers.get(roomId).set(socket.id, userName);

    // Send current document content to the new user
    const document = roomDocuments.get(roomId);
    socket.emit("document-content", document.content);

    // Send updated user list to all users in the room
    const users = Array.from(roomUsers.get(roomId).values());
    io.to(roomId).emit("users-updated", users);

    console.log(`User ${userName} joined room ${roomId}`);
  });

  // Handle document updates
  socket.on("document-update", ({ roomId, content }) => {
    if (roomDocuments.has(roomId)) {
      const document = roomDocuments.get(roomId);
      document.content = content;
      document.lastModified = Date.now();

      // Broadcast update to all other users in the room
      socket.to(roomId).emit("document-updated", content);
    }
  });

  // Handle cursor position updates
  socket.on("cursor-update", ({ roomId, position, userName, selection }) => {
    socket.to(roomId).emit("user-cursor", {
      userId: socket.id,
      userName,
      position,
      selection,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from all rooms
    for (const [roomId, users] of roomUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);

        // Send updated user list to remaining users
        const remainingUsers = Array.from(users.values());
        io.to(roomId).emit("users-updated", remainingUsers);

        // Clean up empty rooms
        if (users.size === 0) {
          roomUsers.delete(roomId);
          roomDocuments.delete(roomId);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
