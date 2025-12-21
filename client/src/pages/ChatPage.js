import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import api from "../api/axiosConfig";
import useSocket from "../hooks/useSocket";

const ChatPage = () => {
  const { user, logout } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  // Single socket for the logged-in user
  const socket = useSocket(user);

  // --- FIXED AVATAR RENDERER ---
  // This prevents the "Broken Image" icon by handling the data string correctly
  const renderMyAvatar = (avatar) => {
    if (!avatar) return null;

    let imageSrc = avatar;

    // 1. If it ALREADY starts with "data:image", DO NOT add it again
    if (avatar.startsWith("data:image")) {
      imageSrc = avatar;
    } 
    // 2. If it looks like raw Base64 (long string, no http), ADD the prefix
    else if (!avatar.startsWith("http") && avatar.length > 30) {
      imageSrc = `data:image/svg+xml;base64,${avatar}`;
    }

    // 3. Render the image
    return (
      <img 
        src={imageSrc} 
        alt="my-avatar" 
        style={{ 
          width: "32px", 
          height: "32px", 
          borderRadius: "50%", 
          objectFit: "cover", 
          border: "2px solid #e2e8f0",
          marginLeft: "8px",
          marginRight: "4px",
          display: "inline-block", // Ensures layout stability
          backgroundColor: "#fff"  // White background behind transparent avatars
        }} 
      />
    );
  };

  if (!user) {
    return (
      <div className="chat-window-empty">
        <h2>Loading user…</h2>
      </div>
    );
  }

  const handleChangeAvatar = () => navigate("/avatar");

  const handleDeleteAccount = async () => {
    const ok = window.confirm("Are you sure? Your chat + account will be deleted forever.");
    if (!ok) return;
    try {
      await api.delete("/api/users/me");
      logout();
      navigate("/register");
    } catch (err) {
      console.error("Delete account error:", err.response?.data || err.message);
      alert("Failed to delete account.");
    }
  };

  return (
    <div className="chat-layout">
      <Sidebar
        onSelect={setSelectedUser}
        selectedUser={selectedUser}
        currentUserId={user._id}
        socket={socket}
      />

      <div className="chat-main">
        {/* TOP BAR */}
        <div className="chat-topbar">
          <div className="chat-topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: "5px" }}>Logged in as</span>
            
            {/* The Avatar Image */}
            {renderMyAvatar(user.avatar)}
            
            <span className="name" style={{ fontWeight: 'bold' }}>{user.username}</span>
          </div>
          
          <div className="chat-topbar-buttons">
            <button className="btn" onClick={handleChangeAvatar}>Change avatar</button>
            <button className="btn" onClick={logout}>Logout</button>
            <button className="btn btn-danger" onClick={handleDeleteAccount}>Delete account</button>
          </div>
        </div>

        <ChatWindow 
          key={selectedUser?._id} // Ensures component resets on user switch
          user={user} 
          chatWith={selectedUser} 
          socket={socket} 
        />
      </div>
    </div>
  );
};

export default ChatPage;