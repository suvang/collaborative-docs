/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { getCursorOrLabelColor } from "../utils/colorUtils";

const UserCursors = ({ editor, socket, containerRef }) => {
  const [otherUsers, setOtherUsers] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handleUserCursor = (data) => {
      if (data.userId !== socket.id) {
        setOtherUsers((prev) => ({
          ...prev,
          [data.userId]: {
            userName: data.userName,
            position: data.position,
            lastSeen: Date.now(),
          },
        }));
      }
    };

    socket.on("user-cursor", handleUserCursor);

    return () => {
      socket.off("user-cursor", handleUserCursor);
    };
  }, [socket]);

  // Clean up old cursors (remove after 5 seconds of inactivity)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOtherUsers((prev) => {
        const filtered = {};
        Object.keys(prev).forEach((userId) => {
          if (now - prev[userId].lastSeen < 5000) {
            filtered[userId] = prev[userId];
          }
        });
        return filtered;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const renderCursors = () => {
    if (!editor || !editor.view) return null;

    return Object.entries(otherUsers).map(([userId, userData]) => {
      const { position, userName: otherUserName } = userData;

      if (position === undefined || position === null) return null;

      try {
        // Convert position to screen coordinates
        const coords = editor.view.coordsAtPos(position);
        if (!coords) return null;

        // fix this later...
        const editorElement = editor.view.dom;
        const containerElement =
          containerRef?.current ||
          editorElement.closest(".bg-white.rounded-lg.shadow-sm.border");
        const containerRect = containerElement
          ? containerElement.getBoundingClientRect()
          : editorElement.getBoundingClientRect();

        // Calculate relative position within the editor container
        const relativeLeft = coords.left - containerRect.left;
        const relativeTop = coords.top - containerRect.top;
        const relativeBottom = coords.bottom - containerRect.top;

        const cursorColor = getCursorOrLabelColor(otherUserName);
        const labelColor = getCursorOrLabelColor(otherUserName);

        return (
          <div key={userId}>
            {/* User name label */}
            <div
              className="absolute z-50 px-2 py-1 text-xs font-medium text-white rounded shadow-lg pointer-events-none"
              style={{
                left: relativeLeft,
                top: relativeTop - 25,
                backgroundColor: labelColor,
                transform: "translateX(-50%)",
              }}
            >
              {otherUserName}
            </div>

            {/* Cursor line */}
            <div
              className="absolute w-0.5 z-40 pointer-events-none"
              style={{
                left: relativeLeft,
                top: relativeTop,
                height: relativeBottom - relativeTop,
                backgroundColor: cursorColor,
                animation: "blink 1s infinite",
              }}
            />
          </div>
        );
      } catch (error) {
        console.warn("Error rendering cursor for user:", otherUserName, error);
        return null;
      }
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {renderCursors()}
      <style jsx>{`
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default UserCursors;
