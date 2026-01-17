import { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinRoom() {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const generateRoomId = () => {
    // Generate a unique room ID based on timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomString}`;
  };

  const handleJoinRoom = () => {
    if (userName.trim()) {
      // Use provided roomId if it exists, otherwise generate a new one
      const finalRoomId = roomId.trim() || generateRoomId();
      navigate(
        `/editor/${finalRoomId}?user=${encodeURIComponent(userName.trim())}`
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join a Room
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your name to start collaborating. Optionally enter a room ID
            to join an existing room.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="user-name" className="sr-only">
              Your Name
            </label>
            <input
              id="user-name"
              name="user-name"
              type="text"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div>
            <label htmlFor="room-id" className="sr-only">
              Room ID (Optional)
            </label>
            <input
              id="room-id"
              name="room-id"
              type="text"
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Room ID (optional - leave empty to create new room)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div>
            <button
              onClick={handleJoinRoom}
              disabled={!userName.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {roomId.trim() ? "Join Room" : "Create New Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinRoom;
