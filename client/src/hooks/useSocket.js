// client/src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";
const SOCKET_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://banterbee.onrender.com";
    
export default function useSocket(user) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) {
      // if there's an existing socket, disconnect it
      if (socketRef.current) {
        try { socketRef.current.disconnect(); } catch (e) {}
        socketRef.current = null;
      }
      return;
    }

    // create socket (with websocket transport)
    const s = io(SOCKET_URL, {
      query: { userId: user._id },
      transports: ["websocket"],
    });

    socketRef.current = s;

    // cleanup on unmount or user change
    return () => {
      try { s.disconnect(); } catch (e) {}
      socketRef.current = null;
    };
  }, [user?._id]);

  return socketRef.current;
}
