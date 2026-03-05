import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion"; 
import api from "../api/axiosConfig";
import ChatInput from "./ChatInput"; 
import logo from "../assets/logo.png"; 

const ChatWindow = ({ user, chatWith, socket }) => {
  const [messages, setMessages] = useState([]);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  
  // Ref to track the ACTIVE chat partner for socket safety
  const activeChatRef = useRef(chatWith);

  // Sync the Ref whenever chatWith changes
  useEffect(() => {
    activeChatRef.current = chatWith;
  }, [chatWith]);

  // Helper to normalize IDs
  const idStr = useCallback((val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (val?._id) return idStr(val._id);
    if (val?.toString) return val.toString();
    return String(val);
  }, []);

  // --- TIME FORMATTER ---
  const formatTime = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Just now";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- DATE DIVIDER HELPER ---
  const getDateLabel = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return date.toLocaleDateString(undefined, { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    try {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    } catch (e) { }
  }, []);

  const markMessagesReadServer = useCallback(async (userId, otherId) => {
    try {
      await api.post("/api/messages/mark-read", { userId, otherId });
    } catch (err) {
      console.debug("markMessagesReadServer error:", err?.message || err);
    }
  }, []);

  // --- RENDER AVATAR FUNCTION ---
  const renderAvatar = (avatar) => {
    if (!avatar) return <span className="chat-avatar-fallback">👤</span>;

    if (avatar.startsWith("data:image") || avatar.startsWith("http")) {
      return <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />;
    }
    if (avatar.length > 30) {
      return <img src={`data:image/svg+xml;base64,${avatar}`} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />;
    }
    return <span className="chat-avatar-emoji">{avatar}</span>;
  };

  // --- TICKS (WhatsApp Style) ---
  const renderMessageStatus = (msg) => {
    if (msg.read) {
      return (
        <span style={{ color: "#53bdeb", fontWeight: "bold", fontSize: "12px", letterSpacing: "-1px" }} title="Seen">
          ✓✓
        </span>
      );
    }
    return (
      <span style={{ color: "#8696a0", fontWeight: "bold", fontSize: "12px", letterSpacing: "-1px" }} title="Delivered">
        ✓✓
      </span>
    );
  };

  // 1. LOAD HISTORY
  useEffect(() => {
    let cancelled = false;
    setMessages([]);

    if (!user?._id || !chatWith?._id) return;

    const fetchChats = async () => {
      try {
        const myId = idStr(user._id);
        const otherId = idStr(chatWith._id);

        const res = await api.get(`/api/messages/${myId}/${otherId}`);
        if (cancelled) return;

        const msgs = Array.isArray(res.data) ? res.data : [];
        setMessages(msgs);

        await markMessagesReadServer(myId, otherId);

        try {
          if (socket && typeof socket.emit === "function") {
            socket.emit("messages-read", { reader: myId, other: otherId });
          }
        } catch (e) {
          console.debug("[ChatWindow] emit error:", e);
        }

        setTimeout(() => scrollToBottom("auto"), 50);
      } catch (err) {
        console.error("Fetch chat error:", err?.response?.data || err.message);
      }
    };

    fetchChats();
    return () => { cancelled = true; };
  }, [user?._id, chatWith?._id, markMessagesReadServer, socket, scrollToBottom, idStr]);

  // Auto-scroll
  useEffect(() => {
    if (isNearBottom()) {
      setTimeout(() => scrollToBottom("smooth"), 40);
    }
  }, [messages, isNearBottom, scrollToBottom]);

  // Join Room
  useEffect(() => {
    if (!socket || !user?._id) return;
    try {
      socket.emit("join", idStr(user._id));
    } catch (e) {
      console.debug("Socket join error:", e);
    }
  }, [socket, user?._id, idStr]);

  // 2. HANDLE REAL-TIME MESSAGES
  useEffect(() => {
    if (!socket || !user?._id) return;
    const myId = idStr(user._id);

    const handleNewMessage = (msg) => {
      if (!msg) return;

      const senderId = idStr(msg.sender);
      const receiverId = idStr(msg.receiver);
      const currentPartnerId = idStr(activeChatRef.current?._id);

      const isIncomingFromPartner = (senderId === currentPartnerId && receiverId === myId);
      const isOutgoingToPartner = (senderId === myId && receiverId === currentPartnerId);

      if (!isIncomingFromPartner && !isOutgoingToPartner) return;

      const msgToStore = { 
        ...msg, 
        read: isIncomingFromPartner ? true : msg.read,
        createdAt: msg.createdAt || new Date().toISOString()
      };

      setMessages((prev) => {
        const exists = prev.some((m) => idStr(m._id) === idStr(msg._id));
        if (exists) return prev;
        const updated = [...prev, msgToStore];
        updated.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        return updated;
      });

      if (isIncomingFromPartner) {
        try {
          markMessagesReadServer(myId, currentPartnerId);
          if (socket && typeof socket.emit === "function") {
            socket.emit("messages-read", { reader: myId, other: currentPartnerId });
          }
        } catch (e) { }
      }
    };

    socket.on("receive-message", handleNewMessage);
    return () => { socket.off("receive-message", handleNewMessage); };
  }, [socket, user?._id, idStr, markMessagesReadServer]); 

  // 3. LISTEN FOR READ RECEIPTS
  useEffect(() => {
    if (!socket || !user?._id) return;
    const myId = idStr(user._id);

    const handleMessagesRead = (payload = {}) => {
      const reader = idStr(payload.reader);
      const other = idStr(payload.other);
      if (other !== myId) return;

      const currentPartnerId = idStr(activeChatRef.current?._id);
      if (!currentPartnerId || currentPartnerId !== reader) return;

      setMessages((prev) =>
        prev.map((m) => {
          const senderId = idStr(m.sender);
          if (senderId === myId) return { ...m, read: true };
          return m;
        })
      );
    };

    socket.on("messages-read", handleMessagesRead);
    return () => { socket.off("messages-read", handleMessagesRead); };
  }, [socket, user?._id, idStr]);

  const handleClearChat = async () => {
    if (!chatWith) return;
    const ok = window.confirm(`Clear conversation with ${chatWith.username}?`);
    if (!ok) return;

    try {
      await api.delete(`/api/messages/${idStr(user._id)}/${idStr(chatWith._id)}`);
      setMessages([]); 
    } catch (err) {
      alert("Failed to clear chat.");
    }
  };

  const handleSend = async (text) => {
    if (!chatWith || !text.trim()) return;
    const payload = { sender: user._id, receiver: chatWith._id, text };
    try {
      await api.post("/api/messages/send", payload);
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  if (!chatWith) {
    return (
      <div className="chat-window-empty">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="empty-state-content"
        >
          <motion.img 
            src={logo} 
            alt="BanterBee" 
            className="empty-state-logo"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            Welcome, <span style={{ color: "#6366f1" }}>{user?.username}!</span> 👋
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Please select a chat to start messaging.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="chat-window" style={{ position: "relative", display: "flex", flexDirection: "column", height: '100%' }}>
      
      {/* HEADER */}
      <div className="chat-window-header" style={{ zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="chat-avatar-wrap" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {renderAvatar(chatWith.avatar)}
          </div>
          <span className="chat-window-header-name">{chatWith.username}</span>
        </div>
        <button className="btn" onClick={handleClearChat}>Clear chat</button>
      </div>

      <div className="chat-messages" ref={containerRef} style={{ paddingBottom: 20, overflowY: "auto", flex: 1 }}>
        {messages.map((m, index) => {
          const myId = idStr(user._id);
          const senderId = typeof m.sender === "string" ? m.sender : idStr(m.sender);
          const isMe = senderId === myId;
          
          const currentLabel = getDateLabel(m.createdAt);
          const prevLabel = index > 0 ? getDateLabel(messages[index - 1].createdAt) : "";
          const showDateDivider = currentLabel !== prevLabel;

          return (
            <React.Fragment key={m._id || `${senderId}-${m.text}-${index}`}>
              
              {/* DATE DIVIDER */}
              {showDateDivider && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  margin: "20px 0 10px 0",
                  opacity: 0.8 
                }}>
                  <span style={{ 
                    backgroundColor: "#f1f5f9", 
                    color: "#64748b", 
                    fontSize: "11px", 
                    padding: "4px 10px", 
                    borderRadius: "10px",
                    fontWeight: "600",
                    border: "1px solid #e2e8f0"
                  }}>
                    {currentLabel}
                  </span>
                </div>
              )}

              {/* MESSAGE BUBBLE - CLEANED UP (No Sticker Logic) */}
              <div className={"chat-bubble " + (isMe ? "chat-bubble--me" : "chat-bubble--other")}>
                
                {/* JUST THE TEXT */}
                <div className="chat-bubble-text">{m.text}</div>
                
                {/* --- TIME & TICKS --- */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                  <span style={{ fontSize: "10px", opacity: 0.7, color: isMe ? "#e0e0e0" : "#64748b" }}>
                    {formatTime(m.createdAt)}
                  </span>
                  {isMe && renderMessageStatus(m)}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="message-input" style={{ position: "sticky", bottom: 0, zIndex: 6 }}>
        <ChatInput handleSendMsg={handleSend} />
      </div>
    </div>
  );
};

export default ChatWindow;