import React, { useState, useEffect, useRef } from "react";
import Picker from "emoji-picker-react";
import { FaSmile, FaPaperPlane } from "react-icons/fa";
import "../App.css";

const ChatInput = ({ handleSendMsg }) => {
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (event, emojiObject) => {
    setMsg((prev) => prev + emojiObject.emoji);
  };

  const sendChat = (event) => {
    event.preventDefault();
    if (msg.trim().length > 0) {
      handleSendMsg(msg);
      setMsg("");
    }
  };

  return (
    <div
      className="chat-input-wrapper"
      ref={pickerRef}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "transparent",
      }}
    >
      {showEmojiPicker && (
        <div
          className="emoji-picker-container"
          style={{
            position: "absolute",
            bottom: "60px",
            left: "0",
            zIndex: 100,
          }}
        >
          <Picker
            onEmojiClick={handleEmojiClick}
            disableAutoFocus={true}
            skinTone={false}
            groupNames={{
              smileys_people: "Smileys & People",
              animals_nature: "Animals & Nature",
              food_drink: "Food & Drink",
              travel_places: "Travel & Places",
              activities: "Activities",
              objects: "Objects",
              symbols: "Symbols",
              flags: "Flags",
            }}
          />
        </div>
      )}

      <div
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        style={{
          cursor: "pointer",
          color: showEmojiPicker ? "#00a884" : "#8696a0",
          fontSize: "24px",
          display: "flex",
          alignItems: "center",
          padding: "8px",
        }}
      >
        <FaSmile />
      </div>

      {/* 🔒 SEARCH BAR — UPDATED FOR PERMANENT BORDER */}
      <form
        onSubmit={sendChat}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          background: "white",
          borderRadius: "8px",
          padding: "8px 12px",
          // 👇 CHANGED: From #ffffff (invisible) to #e0e0e0 (Visible Grey)
          border: "1px solid #e0e0e0", 
          boxShadow: "none", // Prevents any external shadow
        }}
      >
        <input
          type="text"
          placeholder="Type a message"
          onChange={(e) => setMsg(e.target.value)}
          value={msg}
          onClick={() => setShowEmojiPicker(false)}
          style={{
            flex: 1,
            border: "none",
            outline: "none", // Ensures no "square" focus ring appears
            fontSize: "15px",
            color: "#111b21",
            background: "transparent",
          }}
        />
      </form>

      <button
        onClick={sendChat}
        disabled={msg.trim().length === 0}
        style={{
          background: "transparent",
          border: "none",
          fontSize: "20px",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          transition: "color 0.3s ease",
          cursor: msg.trim().length > 0 ? "pointer" : "default",
          color: msg.trim().length > 0 ? "#00a884" : "#8696a0",
        }}
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default ChatInput;