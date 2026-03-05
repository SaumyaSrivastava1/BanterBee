import React, { useEffect, useState, useRef } from "react";
import api from "../api/axiosConfig";
import logo from "../assets/logo2.png";
import { FaUserMinus, FaSearch } from "react-icons/fa"; // Import icons

const Sidebar = ({ onSelect, selectedUser, currentUserId, socket }) => {
  // --- STATE ---
  const [view, setView] = useState("chats");
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [unreadMap, setUnreadMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- REFS ---
  // Removed usersRef and friendsRef to fix warnings
  const unreadRef = useRef({});
  const loadingRef = useRef(true);
  const socketRef = useRef(null);
  const processedMessageIdsRef = useRef(new Set());
  const fetchUnreadDebounceTimer = useRef(null);
  const scheduleFetchUnreadRef = useRef(() => {});

  // --- SYNC REFS ---
  useEffect(() => { socketRef.current = socket || null; }, [socket]);
  useEffect(() => { unreadRef.current = unreadMap; }, [unreadMap]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // --- CLEANUP TIMER ---
  useEffect(() => {
    const id = setInterval(() => {
      const s = processedMessageIdsRef.current;
      if (s.size > 2000) processedMessageIdsRef.current = new Set(Array.from(s).slice(-1000));
    }, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }
    let cancelled = false;

    const fetchData = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const [allRes, friendsRes, sentRes] = await Promise.all([
          api.get("/api/users/all"),
          api.get(`/api/requests/friends/${currentUserId}`),
          api.get(`/api/requests/sent/${currentUserId}`),
        ]);
        if (cancelled) return;
        
        // Directly set state, no refs needed here
        setUsers(allRes.data || []);
        setFriends(friendsRes.data || []);
        setSentRequests(new Set(sentRes.data || []));
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
      } catch (err) { }
    };

    fetchData(true).then(() => fetchUnreadInner());
    const interval = setInterval(() => { fetchData(); fetchUnreadInner(); }, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentUserId]);

  // --- 2. FETCH PENDING REQUESTS ---
  useEffect(() => {
    if (!currentUserId) return;
    const fetchRequests = async () => {
      try {
        const res = await api.get(`/api/requests/pending/${currentUserId}`);
        setRequests(res.data || []);
      } catch (err) { console.error(err); }
    };
    fetchRequests();
    const reqInterval = setInterval(fetchRequests, 10000);
    return () => clearInterval(reqInterval);
  }, [currentUserId]);

  // --- SOCKET LISTENERS ---
  const fetchUnread = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.get(`/api/messages/unread-summary/${currentUserId}`);
      const map = {};
      (res.data || []).forEach((r) => {
        const k = String(r.userId ?? r._id ?? r.sender ?? "");
        map[k] = Number(r.count ?? 0);
      });
      setUnreadMap(map);
    } catch (err) { }
  };

  scheduleFetchUnreadRef.current = () => {
    if (fetchUnreadDebounceTimer.current) clearTimeout(fetchUnreadDebounceTimer.current);
    fetchUnreadDebounceTimer.current = setTimeout(() => fetchUnread(), 300);
  };

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
        setUnreadMap((prev) => ({ ...(prev || {}), [sender]: (prev[sender] || 0) + 1 }));
        scheduleFetchUnreadRef.current();
      }
    };
    const handleMessagesRead = (payload = {}) => {
        const reader = String(payload.reader ?? "");
        const other = String(payload.other ?? "");
        if (reader === myId && other) {
          setUnreadMap((prev) => ({ ...(prev || {}), [other]: 0 }));
        }
    };
    s.on("receive-message", handleReceive);
    s.on("messages-read", handleMessagesRead);
    return () => {
      s.off("receive-message", handleReceive);
      s.off("messages-read", handleMessagesRead);
    };
  }, [currentUserId, selectedUser]);

  // --- HANDLERS ---
  const handleSendRequest = async (e, userId) => {
    e.stopPropagation();
    try {
      await api.post("/api/requests/send", { from: currentUserId, to: userId });
      setSentRequests(prev => new Set(prev).add(userId));
    } catch (err) { alert("Failed to send request."); }
  };

  const handleAcceptRequest = async (e, requestId) => {
    e.stopPropagation();
    try {
      await api.post("/api/requests/accept", { requestId });
      const reqRes = await api.get(`/api/requests/pending/${currentUserId}`);
      setRequests(reqRes.data || []);
      const friendRes = await api.get(`/api/requests/friends/${currentUserId}`);
      setFriends(friendRes.data || []);
      alert("Friend Added!");
    } catch (err) { console.error(err); }
  };

  const handleDenyRequest = async (e, requestId) => {
    e.stopPropagation();
    try {
      await api.post("/api/requests/deny", { requestId });
      setRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) { console.error(err); alert("Failed to deny request."); }
  };

  const handleRemoveFriend = async (e, friendId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      await api.post("/api/requests/remove", { userId: currentUserId, friendId });
      setFriends(prev => prev.filter(f => f._id !== friendId));
      if (selectedUser?._id === friendId) onSelect(null);
    } catch (err) { alert("Failed to remove friend."); }
  };

  const handleSelect = async (u) => {
    const key = String(u._id);
    setUnreadMap((prev) => ({ ...(prev || {}), [key]: 0 }));
    onSelect && onSelect(u);
    try {
        await api.post("/api/messages/mark-read", { userId: currentUserId, otherId: u._id });
        const s = socketRef.current;
        if (s) s.emit("messages-read", { reader: String(currentUserId), other: key });
      } catch (e) {}
  };

  // --- SEARCH & FILTERS ---
  const matchesSearch = (u) => u.username.toLowerCase().includes(searchQuery.toLowerCase());

  const isFriend = (userId) => friends.some((f) => String(f._id) === String(userId));
  const visibleUsers = users.filter((u) => String(u._id) !== String(currentUserId));

  // Filtered lists based on VIEW + SEARCH
  const friendList = visibleUsers.filter((u) => isFriend(u._id) && matchesSearch(u));
  const exploreList = visibleUsers.filter((u) => !isFriend(u._id) && matchesSearch(u));
  const requestsList = requests.filter((req) => req.sender.username.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderAvatar = (avatar) => {
    if (!avatar) return <span className="chat-avatar-fallback">👤</span>;
    if (avatar.startsWith("data:image") || avatar.startsWith("http")) return <img src={avatar} alt="avatar" style={{width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%"}} />;
    return <span className="chat-avatar-emoji">{avatar}</span>;
  };

  return (
    <div className="chat-sidebar">
      {/* HEADER */}
      <div className="chat-sidebar-header">
        <img src={logo} alt="BanterBee" className="chat-sidebar-logo" />
        <h3 className="chat-sidebar-title">BanterBee</h3>
      </div>

      {/* TABS */}
      <div className="sidebar-tabs" style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 5px', borderBottom: '1px solid #eee' }}>
        <button onClick={() => setView("chats")} style={{ fontWeight: view === 'chats' ? 'bold' : 'normal', color: view === 'chats' ? '#6366f1' : '#666', border: 'none', background: 'none', cursor: 'pointer' }}>Chats</button>
        <button onClick={() => setView("explore")} style={{ fontWeight: view === 'explore' ? 'bold' : 'normal', color: view === 'explore' ? '#6366f1' : '#666', border: 'none', background: 'none', cursor: 'pointer' }}>Explore</button>
        <button onClick={() => setView("requests")} style={{ fontWeight: view === 'requests' ? 'bold' : 'normal', color: view === 'requests' ? '#6366f1' : '#666', border: 'none', background: 'none', cursor: 'pointer' }}>
          Requests {requests.length > 0 && <span style={{fontSize:'10px', background:'red', color:'white', padding:'2px 5px', borderRadius:'10px', marginLeft:'4px'}}>{requests.length}</span>}
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="search-bar-container" style={{ padding: "10px 15px 5px 15px" }}>
         <div style={{
           display: "flex",
           alignItems: "center",
           backgroundColor: "#f3f4f6",
           borderRadius: "20px",
           padding: "8px 15px",
         }}>
           <FaSearch style={{ color: "#9ca3af", marginRight: "10px" }} />
           <input
             type="text"
             placeholder="Search users..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             style={{
               border: "none",
               background: "transparent",
               outline: "none",
               width: "100%",
               fontSize: "14px",
               color: "#374151"
             }}
           />
         </div>
       </div>

      {loading && <p className="chat-sidebar-helper">Loading...</p>}

      {/* 1. CHATS TAB */}
      {view === "chats" && (
        <div className="chat-list">
          {friendList.length === 0 && !loading && searchQuery === "" && <p className="chat-sidebar-helper">No friends yet. Go to Explore!</p>}
          {friendList.map((u) => {
            const key = String(u._id);
            const badge = Number((unreadMap && unreadMap[key]) || 0);
            return (
              <div key={key} className={`chat-user-row ${selectedUser?._id === u._id ? "chat-user-row--selected" : ""}`} onClick={() => handleSelect(u)}>
                <div className="chat-avatar-wrap">{renderAvatar(u.avatar)}</div>
                <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span className="chat-username">{u.username}</span>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        {badge > 0 && <span className="unread-badge">{badge > 9 ? "9+" : badge}</span>}
                        {/* COOL UNFRIEND ICON */}
                        <button
                            onClick={(e) => handleRemoveFriend(e, u._id)}
                            title="Unfriend"
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", display: "flex", alignItems: "center", padding: "5px", borderRadius: "50%" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "#fee2e2"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            <FaUserMinus />
                        </button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. EXPLORE TAB */}
      {view === "explore" && (
        <div className="chat-list">
          {exploreList.map((u) => {
            const isPending = sentRequests.has(u._id);
            return (
                <div key={u._id} className="chat-user-row">
                    <div className="chat-avatar-wrap">{renderAvatar(u.avatar)}</div>
                    <span className="chat-username">{u.username}</span>
                    <button
                        className="chat-friend-btn"
                        onClick={(e) => !isPending && handleSendRequest(e, u._id)}
                        disabled={isPending}
                        style={{ opacity: isPending ? 0.6 : 1, cursor: isPending ? 'default' : 'pointer', backgroundColor: isPending ? '#9ca3af' : '#6366f1' }}
                    >
                        {isPending ? "Pending" : "Add +"}
                    </button>
                </div>
            );
          })}
        </div>
      )}

      {/* 3. REQUESTS TAB */}
      {view === "requests" && (
        <div className="chat-list">
          {requestsList.length === 0 && !loading && searchQuery === "" && <p className="chat-sidebar-helper">No pending requests.</p>}
          {requestsList.map((req) => (
            <div key={req._id} className="chat-user-row">
              <div className="chat-avatar-wrap">{renderAvatar(req.sender.avatar)}</div>
              <span className="chat-username">{req.sender.username}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="chat-friend-btn" onClick={(e) => handleAcceptRequest(e, req._id)} style={{ padding: "4px 8px", fontSize: "12px" }}>Accept</button>
                <button className="chat-friend-btn" onClick={(e) => handleDenyRequest(e, req._id)} style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#ef4444" }}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;