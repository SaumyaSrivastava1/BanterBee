import React, { useEffect, useState, useRef } from "react";
import api from "../api/axiosConfig";
import logo from "../assets/logo2.png"; // Import Logo

const Sidebar = ({ onSelect, selectedUser, currentUserId, socket }) => {
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [loading, setLoading] = useState(true);

  const usersRef = useRef([]);
  const friendsRef = useRef([]);
  const unreadRef = useRef({});
  const loadingRef = useRef(true);
  const socketRef = useRef(null);

  // set socket ref
  useEffect(() => {
    socketRef.current = socket || null;
  }, [socket]);

  // keep refs in sync with state
  useEffect(() => {
    unreadRef.current = unreadMap;
  }, [unreadMap]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // small debounce / throttle for server fetch triggered by socket
  const fetchUnreadDebounceTimer = useRef(null);
  const scheduleFetchUnreadRef = useRef(() => {});

  // keep track of processed message ids to avoid duplicate increments
  const processedMessageIdsRef = useRef(new Set());
  
  useEffect(() => {
    const id = setInterval(() => {
      const s = processedMessageIdsRef.current;
      if (s.size > 2000) {
        processedMessageIdsRef.current = new Set(Array.from(s).slice(-1000));
      }
    }, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // fetch users and friends + unread
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUsersAndFriends = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const [allRes, friendsRes] = await Promise.all([
          api.get("/api/users/all"),
          api.get("/api/users/friends"),
        ]);
        if (cancelled) return;

        const nextUsers = allRes.data || [];
        const nextFriends = friendsRes.data || [];

        usersRef.current = nextUsers;
        setUsers(nextUsers);
        
        friendsRef.current = nextFriends;
        setFriends(nextFriends);

      } catch (err) {
        if (!cancelled) console.error("Fetch data error:", err);
      } finally {
        if (!cancelled && loadingRef.current) setLoading(false);
      }
    };

    const fetchUnreadInner = async () => {
      try {
        const res = await api.get(`/api/messages/unread-summary/${currentUserId}`);
        if (cancelled) return;
        const map = {};
        (res.data || []).forEach((r) => {
          const k = String(r.userId ?? r._id ?? r.sender ?? "");
          map[k] = Number(r.count ?? 0);
        });

        unreadRef.current = map;
        setUnreadMap(map);
      } catch (err) {
        if (!cancelled) console.error("Unread summary error:", err);
      }
    };

    fetchUsersAndFriends(true).then(() => fetchUnreadInner());

    const interval = setInterval(() => {
      fetchUsersAndFriends();
      fetchUnreadInner();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUserId]);

  const fetchUnread = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.get(`/api/messages/unread-summary/${currentUserId}`);
      const map = {};
      (res.data || []).forEach((r) => {
        const k = String(r.userId ?? r._id ?? r.sender ?? "");
        map[k] = Number(r.count ?? 0);
      });
      unreadRef.current = map;
      setUnreadMap(map);
    } catch (err) { }
  };

  scheduleFetchUnreadRef.current = () => {
    if (fetchUnreadDebounceTimer.current) clearTimeout(fetchUnreadDebounceTimer.current);
    fetchUnreadDebounceTimer.current = setTimeout(() => {
      fetchUnread().catch((e) => console.debug("fetchUnread debounce failed:", e));
    }, 300);
  };

  // SOCKET UPDATES (The WhatsApp Logic)
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !currentUserId) return;

    const myId = String(currentUserId);

    const handleReceive = (msg) => {
      if (!msg) return;

      const sender = String(msg.sender?._id ?? msg.sender ?? msg.from ?? "");
      const mid = String(msg._id ?? msg.id ?? `${sender}_${msg.createdAt || ""}`);

      if (processedMessageIdsRef.current.has(mid)) return;
      processedMessageIdsRef.current.add(mid);

      const isChattingWithSender = selectedUser && String(selectedUser._id) === sender;
      const receiver = String(msg.receiver?._id ?? msg.receiver ?? "");

      if (receiver === myId && sender !== myId) {
        if (isChattingWithSender) {
           setUnreadMap((prev) => ({ ...(prev || {}), [sender]: 0 }));
           return;
        }

        setUnreadMap((prev) => {
          const next = { ...(prev || {}) };
          next[sender] = (next[sender] || 0) + 1;
          unreadRef.current = next;
          return next;
        });
        scheduleFetchUnreadRef.current();
      }
    };

    const handleMessagesRead = (payload = {}) => {
      const reader = String(payload.reader ?? "");
      const other = String(payload.other ?? "");

      if (reader === myId && other) {
        unreadRef.current = { ...(unreadRef.current || {}), [other]: 0 };
        setUnreadMap((prev) => ({ ...(prev || {}), [other]: 0 }));
      }
    };

    const handleChatCleared = (payload = {}) => {
      const by = String(payload.by ?? "");
      const other = String(payload.other ?? "");
      if (by === myId && other) {
        setUnreadMap((prev) => ({ ...(prev || {}), [other]: 0 }));
      }
    };

    s.on("receive-message", handleReceive);
    s.on("messages-read", handleMessagesRead);
    s.on("chat-cleared", handleChatCleared);

    return () => {
      s.off("receive-message", handleReceive);
      s.off("messages-read", handleMessagesRead);
      s.off("chat-cleared", handleChatCleared);
    };
  }, [currentUserId, selectedUser]);

  const handleAddFriend = async (e, userId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/users/friends/${userId}`);
      setFriends(res.data || []);
      friendsRef.current = res.data || [];
    } catch (err) { console.error(err); }
  };

  const handleRemoveFriend = async (e, userId) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/api/users/friends/${userId}`);
      setFriends(res.data || []);
      friendsRef.current = res.data || [];
    } catch (err) { console.error(err); }
  };

  const handleSelect = async (u) => {
    const key = String(u._id);
    setUnreadMap((prev) => ({ ...(prev || {}), [key]: 0 }));
    onSelect && onSelect(u);

    if (currentUserId && u?._id) {
      try {
        await api.post("/api/messages/mark-read", {
          userId: currentUserId,
          otherId: u._id,
        });
      } catch (err) {}
      try {
        const s = socketRef.current;
        if (s && typeof s.emit === "function") {
          s.emit("messages-read", { reader: String(currentUserId), other: key });
        }
      } catch (e) {}
    }
  };

  const isFriend = (userId) => friends.some((f) => String(f._id) === String(userId));
  const visibleUsers = users.filter((u) => String(u._id) !== String(currentUserId));
  const friendUsers = visibleUsers.filter((u) => isFriend(u._id));
  const otherUsers = visibleUsers.filter((u) => !isFriend(u._id));

  // --- FIXED RENDER AVATAR (Prevents Double Prefix) ---
  const renderAvatar = (avatar) => {
    if (!avatar) return <span className="chat-avatar-fallback">👤</span>;

    // 1. If it ALREADY has the prefix (New Avatars), use it directly
    if (avatar.startsWith("data:image")) {
      return (
        <img 
          src={avatar} 
          alt="avatar" 
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} 
        />
      );
    }
    
    // 2. If it's a web URL (http/https), use it directly
    if (avatar.startsWith("http")) {
      return (
        <img 
          src={avatar} 
          alt="avatar" 
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} 
        />
      );
    }

    // 3. If it's raw Base64 (Old Avatars), ADD the prefix
    if (avatar.length > 30) {
      return (
        <img 
          src={`data:image/svg+xml;base64,${avatar}`} 
          alt="avatar" 
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} 
        />
      );
    }
    
    return <span className="chat-avatar-emoji">{avatar}</span>;
  };

  const renderRow = (u, friend) => {
    const key = String(u._id);
    const badge = Number((unreadMap && unreadMap[key]) || 0);
    return (
      <div
        key={key}
        className={
          "chat-user-row" +
          (selectedUser && String(selectedUser._id) === key ? " chat-user-row--selected" : "")
        }
        onClick={() => handleSelect(u)}
      >
        <div className="chat-avatar-wrap">
            {renderAvatar(u.avatar)}
        </div>
        
        <span className="chat-username">{u.username}</span>

        {badge > 0 && <span className="unread-badge">{badge > 9 ? "9+" : badge}</span>}

        <button
          className={`chat-friend-btn ${friend ? "remove" : ""}`}
          onClick={(e) => (friend ? handleRemoveFriend(e, u._id) : handleAddFriend(e, u._id))}
        >
          {friend ? "Remove" : "Add"}
        </button>
      </div>
    );
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <img src={logo} alt="BanterBee" className="chat-sidebar-logo" />
        <h3 className="chat-sidebar-title">BanterBee</h3>
      </div>

      {loading && <p className="chat-sidebar-helper">Loading users...</p>}
      
      {friendUsers.length > 0 && (
        <>
          <p className="chat-section-label">FRIENDS</p>
          {friendUsers.map((u) => renderRow(u, true))}
        </>
      )}

      {otherUsers.length > 0 && (
        <>
          {friendUsers.length > 0 && <p className="chat-section-label">OTHERS</p>}
          {otherUsers.map((u) => renderRow(u, false))}
        </>
      )}
    </div>
  );
};

export default Sidebar;