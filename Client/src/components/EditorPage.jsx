import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useEffect, useState, useRef, useMemo } from "react";
import UserCursors from "./UserCursors";
import { cn } from "../utils/cn";

function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get("user") || "Anonymous";
  const { socket, connected } = useSocket();
  const [users, setUsers] = useState([]);
  const isUpdatingFromSocket = useRef(false);
  const cursorUpdateTimeout = useRef(null);
  const editorContainerRef = useRef(null);
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    strike: false,
    heading1: false,
    heading2: false,
    bulletList: false,
    orderedList: false,
  });

  // Function to update active states
  const updateActiveStates = (editor) => {
    if (!editor) return;

    setActiveStates({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      heading1: editor.isActive("heading", { level: 1 }),
      heading2: editor.isActive("heading", { level: 2 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
    });
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing your collaborative document...</p>",
    autofocus: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-6 min-h-[500px] text-gray-900",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromSocket.current && socket && connected) {
        const content = editor.getHTML();
        socket.emit("document-update", { roomId, content });
      }
      updateActiveStates(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      if (socket && connected && !isUpdatingFromSocket.current) {
        // Throttle cursor updates to prevent spam
        if (cursorUpdateTimeout.current) {
          clearTimeout(cursorUpdateTimeout.current);
        }

        cursorUpdateTimeout.current = setTimeout(() => {
          const { from } = editor.state.selection;
          const position = from;

          socket.emit("cursor-update", {
            roomId,
            position,
            userName,
          });
        }, 100); // Throttle to 100ms
      }
      updateActiveStates(editor);
    },
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket || !connected) return;

    // Join room when connected
    socket.emit("join-room", { roomId, userName });

    // Listen for document updates from other users
    socket.on("document-updated", (content) => {
      if (editor && !isUpdatingFromSocket.current) {
        isUpdatingFromSocket.current = true;
        editor.commands.setContent(content);
        isUpdatingFromSocket.current = false;
        updateActiveStates(editor);
      }
    });

    // Listen for initial document content
    socket.on("document-content", (content) => {
      if (editor && !isUpdatingFromSocket.current) {
        isUpdatingFromSocket.current = true;
        editor.commands.setContent(content);
        isUpdatingFromSocket.current = false;
        updateActiveStates(editor);
      }
    });

    // Listen for user list updates
    socket.on("users-updated", (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off("document-updated");
      socket.off("document-content");
      socket.off("users-updated");
    };
  }, [socket, connected, roomId, userName, editor]);

  const handleBackToHome = () => {
    navigate("/");
  };

  const toolbarButtons = useMemo(
    () => [
      {
        id: "bold",
        label: "Bold",
        onClick: () => editor.chain().focus().toggleBold().run(),
        activeKey: "bold",
      },
      {
        id: "italic",
        label: "Italic",
        onClick: () => editor.chain().focus().toggleItalic().run(),
        activeKey: "italic",
      },
      {
        id: "strike",
        label: "Strike",
        onClick: () => editor.chain().focus().toggleStrike().run(),
        activeKey: "strike",
      },
      {
        id: "divider",
        type: "divider",
      },
      {
        id: "heading1",
        label: "H1",
        onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        activeKey: "heading1",
      },
      {
        id: "heading2",
        label: "H2",
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        activeKey: "heading2",
      },
      {
        id: "bulletList",
        label: "Bullet List",
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        activeKey: "bulletList",
      },
      {
        id: "orderedList",
        label: "Numbered List",
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        activeKey: "orderedList",
      },
    ],
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="min-h-screen w-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Back to Home
              </button>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-white">
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-gray-900">
                  Room: {roomId}
                </h1>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-white">Welcome, {userName}!</span>
                {users.length > 1 && (
                  <>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center space-x-1">
                      <div className="flex -space-x-2">
                        {users.slice(0, 3).map((user, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                            title={user}
                          >
                            {user.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {users.length > 3 && (
                          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                            +{users.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {users.length} user{users.length !== 1 ? "s" : ""}{" "}
                        online
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-3">
            {toolbarButtons.map((item) =>
              item.type === "divider" ? (
                <div
                  key={item.id}
                  className="border-l border-gray-300 h-6 mx-2"
                ></div>
              ) : (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded border",
                    activeStates[item.activeKey]
                      ? "bg-indigo-600 text-red-500 border-indigo-600"
                      : "bg-white text-white border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          ref={editorContainerRef}
          className="bg-white rounded-lg shadow-sm border relative"
        >
          <EditorContent editor={editor} className="focus:outline-none" />
          <UserCursors
            editor={editor}
            roomId={roomId}
            userName={userName}
            socket={socket}
            containerRef={editorContainerRef}
          />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
