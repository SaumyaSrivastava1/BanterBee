import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosConfig";
import AvatarPicker from "../components/AvatarPicker"; // Import the new component
import "./AvatarPage.css";

const AvatarPage = () => {
  const navigate = useNavigate();
  const { user, login, token } = useContext(AuthContext); // Grab token here
  
  const [selectedAvatar, setSelectedAvatar] = useState(undefined);
  const [saving, setSaving] = useState(false);

  const setProfilePicture = async () => {
    if (!selectedAvatar) {
      alert("Please select a BanterBee avatar");
      return;
    }
    
    setSaving(true);
    
    try {
      const { data } = await api.put("/api/users/avatar", {
        avatar: selectedAvatar,
      });

      // Robust check for returned data
      if (data && (data.avatar || data.image)) {
        const newAvatar = data.avatar || data.image;
        
        // Update user context
        const updatedUser = { 
          ...user, 
          isAvatarImageSet: true, 
          avatar: newAvatar 
        };
        
        // Ensure we don't lose the token
        const activeToken = token || JSON.parse(localStorage.getItem("chatUser"))?.token;
        
        login(updatedUser, activeToken);
        navigate("/chat");
      } else {
        throw new Error("Invalid server response");
      }
    } catch (err) {
      console.error("Set avatar error", err);
      alert("Error setting avatar. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="welcome-bg">
      <div className="auth-card avatar-card-override" style={{ maxWidth: "600px" }}> 
        
        <div className="auth-header">
          <h2>Pick your BanterBee! 🐝</h2>
          <p>This will be shown to others in chat.</p>
        </div>

        {/* Use the new component */}
        <AvatarPicker 
          selected={selectedAvatar} 
          onSelect={setSelectedAvatar} 
        />

        <button 
          className="auth-btn" 
          onClick={setProfilePicture}
          disabled={saving}
          style={{ marginTop: "20px" }}
        >
          {saving ? "Saving..." : "Save BanterBee"}
        </button>
      </div>
    </div>
  );
};

export default AvatarPage;