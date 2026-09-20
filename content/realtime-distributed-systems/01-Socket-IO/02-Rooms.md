# 02. Rooms

## What Are Rooms?

A room is an arbitrary, server-side grouping of sockets — a way to segment connected clients so you can broadcast messages to a subset of them instead of everyone. Rooms are entirely a Socket.IO server-side concept; the client has no direct awareness of "being in a room" beyond receiving the messages sent to it.

```
                    ┌─────── Room "room-A" ───────┐
Socket 1 (in room-A)│                              │
Socket 2 (in room-A)│                              │
                    └──────────────────────────────┘
                    ┌─────── Room "room-B" ───────┐
Socket 3 (in room-B)│                              │
                    └──────────────────────────────┘
Socket 4 (in no custom room, only its own default room)
```

## Every Socket Automatically Joins Its Own Room

By default, every socket is automatically placed into a room matching its own `socket.id` — this is what makes `socket.emit()` (sending to just that one client) work under the hood.

## Joining and Leaving Rooms

```js
io.on("connection", (socket) => {
  socket.join("room-A");

  socket.on("join-room", (roomName) => {
    socket.join(roomName);
  });

  socket.on("leave-room", (roomName) => {
    socket.leave(roomName);
  });

  socket.on("disconnect", () => {
    // Socket.IO automatically removes the socket from all rooms it was in — no manual cleanup needed
  });
});
```

A socket can join **multiple rooms** simultaneously:

```js
socket.join("room-A");
socket.join("room-B");
socket.join(["room-C", "room-D"]); // join multiple at once
```

## Broadcasting to a Room

```js
// Send to everyone in "room-A", INCLUDING the sender (if the sender is in that room)
io.to("room-A").emit("message", "Hello, room A!");

// Send to everyone in "room-A" EXCEPT the sender
socket.to("room-A").emit("message", "Someone else says hi!");

// Send to multiple rooms at once (union — a socket in either room receives it once, no duplicates)
io.to("room-A").to("room-B").emit("announcement", "Hello both rooms!");
```

## Practical Use Case 1: Chat Rooms

```js
io.on("connection", (socket) => {
  socket.on("join-chat", (chatRoomId) => {
    socket.join(chatRoomId);
    socket.to(chatRoomId).emit("user-joined", { socketId: socket.id });
  });

  socket.on("send-message", ({ chatRoomId, message }) => {
    io.to(chatRoomId).emit("new-message", {
      message,
      senderId: socket.id,
      timestamp: Date.now(),
    });
  });

  socket.on("leave-chat", (chatRoomId) => {
    socket.leave(chatRoomId);
    socket.to(chatRoomId).emit("user-left", { socketId: socket.id });
  });
});
```

Client:

```js
socket.emit("join-chat", "room-123");

socket.on("new-message", (data) => {
  displayMessage(data);
});

socket.emit("send-message", {
  chatRoomId: "room-123",
  message: "Hello everyone!",
});
```

## Practical Use Case 2: Per-User Private Rooms (Targeted Notifications)

A common pattern: automatically join each authenticated user to a room named after their user ID, enabling direct targeting without tracking individual socket IDs manually.

```js
io.on("connection", (socket) => {
  const userId = socket.data.userId; // set during authentication (see Authentication notes)
  socket.join(`user:${userId}`);
});

// Elsewhere in the app — notify a specific user regardless of how many devices/tabs they have open
function notifyUser(userId, notification) {
  io.to(`user:${userId}`).emit("notification", notification);
}
```

This automatically handles multi-device/multi-tab scenarios — if a user has 3 browser tabs open, all 3 sockets join `user:{id}`, and all 3 receive the notification.

## Practical Use Case 3: Document Collaboration (Google-Docs-Style)

```js
io.on("connection", (socket) => {
  socket.on("join-document", (docId) => {
    socket.join(`doc:${docId}`);
    socket
      .to(`doc:${docId}`)
      .emit("collaborator-joined", { socketId: socket.id });
  });

  socket.on("document-edit", ({ docId, change }) => {
    socket.to(`doc:${docId}`).emit("document-edit", change); // broadcast the change to everyone else editing
  });
});
```

## Getting Room Membership Information

```js
// Get all socket IDs currently in a room
const sockets = await io.in("room-A").fetchSockets();
console.log(sockets.map((s) => s.id));

// Get all rooms a specific socket is currently in
console.log(socket.rooms); // a Set, always includes the socket's own default room (its socket.id)

// Get the number of clients in a room
const room = io.sockets.adapter.rooms.get("room-A");
const roomSize = room ? room.size : 0;
```

## Removing All Sockets from a Room

```js
io.socketsLeave("room-A"); // forcibly removes every socket currently in "room-A"
```

## Rooms Are Ephemeral

Rooms have **no persistence** beyond the current server process's memory — they exist only as long as at least one socket is in them, and are entirely recreated from scratch if the server restarts (sockets simply rejoin rooms based on application logic on reconnect, e.g., re-emitting `join-chat` after a reconnection event).

## Common Interview-Style Questions

- **What is a Socket.IO room, and is it a client-side or server-side concept?**
  A room is a server-side grouping of sockets, letting you broadcast to a specific subset of connected clients; the client has no built-in awareness of room membership beyond receiving the messages sent to rooms it happens to be in.

- **What room does every socket automatically belong to by default?**
  A room matching its own `socket.id`, which is what makes targeted `socket.emit()` calls to a single client work internally.

- **What's the difference between `io.to(room).emit()` and `socket.to(room).emit()`?**
  `io.to(room).emit()` sends to everyone in the room, including the socket that triggered the broadcast (if it's a member); `socket.to(room).emit()` sends to everyone in the room except the sender itself.

- **How would you implement per-user targeted notifications that work across multiple open tabs/devices for the same user?**
  Automatically join every authenticated socket to a room named after the user's ID (e.g., `user:{userId}`); notifications sent to that room reach every socket connection that user currently has open, regardless of device/tab count.

- **Do rooms persist across a server restart?**
  No — rooms exist only in the current server process's memory and are recreated as sockets reconnect and rejoin rooms based on application logic; there's no built-in persistence layer for room membership itself.
