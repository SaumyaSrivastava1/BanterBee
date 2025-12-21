import React, { useEffect, useState } from "react";

const AvatarPicker = ({ selected, onSelect }) => {
  const [beeAvatars, setBeeAvatars] = useState([]);

  useEffect(() => {
    // 10 Unique Bee Personalities & Colors
    const variations = [
      { bg: "#e0f2fe", body: "#FFD700", eyes: "normal", mouth: "smile" },
      { bg: "#fce7f3", body: "#F472B6", eyes: "wink", mouth: "grin" },
      { bg: "#dcfce7", body: "#4ADE80", eyes: "cool", mouth: "smirk" },
      { bg: "#fff7ed", body: "#FB923C", eyes: "happy", mouth: "open" },
      { bg: "#f3e8ff", body: "#A78BFA", eyes: "sleepy", mouth: "dot" },
      { bg: "#cffafe", body: "#22D3EE", eyes: "glasses", mouth: "smile" },
      { bg: "#fee2e2", body: "#F87171", eyes: "hearts", mouth: "smile" },
      { bg: "#fef9c3", body: "#FACC15", eyes: "mad", mouth: "frown" },
      { bg: "#fae8ff", body: "#E879F9", eyes: "dizzy", mouth: "wobbly" },
      { bg: "#f1f5f9", body: "#94A3B8", eyes: "wide", mouth: "tongue" },
    ];

    const generated = variations.map((v) => {
      // --- EYES & MOUTH LOGIC ---
      let eyesSvg = `<circle cx="40" cy="40" r="4" fill="#1a1a1a"/><circle cx="60" cy="40" r="4" fill="#1a1a1a"/>`;
      if (v.eyes === "wink") eyesSvg = `<circle cx="40" cy="40" r="4" fill="#1a1a1a"/><path d="M56 40 Q60 35 64 40" stroke="#1a1a1a" stroke-width="3" fill="none"/>`;
      if (v.eyes === "cool") eyesSvg = `<path d="M32 36 h16 v8 a4,4 0 0 1 -4,4 h-8 a4,4 0 0 1 -4,-4 z" fill="#1a1a1a"/><path d="M52 36 h16 v8 a4,4 0 0 1 -4,4 h-8 a4,4 0 0 1 -4,-4 z" fill="#1a1a1a"/><line x1="48" y1="38" x2="52" y2="38" stroke="#1a1a1a" stroke-width="2"/>`;
      if (v.eyes === "happy") eyesSvg = `<path d="M36 40 Q40 35 44 40" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 40 Q60 35 64 40" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      if (v.eyes === "sleepy") eyesSvg = `<line x1="36" y1="40" x2="44" y2="40" stroke="#1a1a1a" stroke-width="3"/><line x1="56" y1="40" x2="64" y2="40" stroke="#1a1a1a" stroke-width="3"/>`;
      if (v.eyes === "glasses") eyesSvg = `<circle cx="40" cy="40" r="8" stroke="#1a1a1a" stroke-width="2" fill="rgba(255,255,255,0.5)"/><circle cx="60" cy="40" r="8" stroke="#1a1a1a" stroke-width="2" fill="rgba(255,255,255,0.5)"/><circle cx="40" cy="40" r="2" fill="#1a1a1a"/><circle cx="60" cy="40" r="2" fill="#1a1a1a"/><line x1="48" y1="40" x2="52" y2="40" stroke="#1a1a1a" stroke-width="2"/>`;
      if (v.eyes === "hearts") eyesSvg = `<path d="M36 40 q2,-4 4,0 q2,-4 4,0 q-4,6 -8,0" fill="#e11d48"/><path d="M56 40 q2,-4 4,0 q2,-4 4,0 q-4,6 -8,0" fill="#e11d48"/>`;
      if (v.eyes === "mad") eyesSvg = `<circle cx="40" cy="42" r="3" fill="#1a1a1a"/><circle cx="60" cy="42" r="3" fill="#1a1a1a"/><path d="M35 35 L45 40" stroke="#1a1a1a" stroke-width="2"/><path d="M65 35 L55 40" stroke="#1a1a1a" stroke-width="2"/>`;
      if (v.eyes === "dizzy") eyesSvg = `<path d="M36 36 l8 8 m0 -8 l-8 8" stroke="#1a1a1a" stroke-width="2"/><path d="M56 36 l8 8 m0 -8 l-8 8" stroke="#1a1a1a" stroke-width="2"/>`;
      if (v.eyes === "wide") eyesSvg = `<circle cx="40" cy="40" r="6" fill="#fff" stroke="#1a1a1a" stroke-width="1"/><circle cx="40" cy="40" r="2" fill="#1a1a1a"/><circle cx="60" cy="40" r="6" fill="#fff" stroke="#1a1a1a" stroke-width="1"/><circle cx="60" cy="40" r="2" fill="#1a1a1a"/>`;

      let mouthSvg = `<path d="M40 55 Q50 62 60 55" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      if (v.mouth === "grin") mouthSvg = `<path d="M40 55 Q50 65 60 55" fill="white" stroke="#1a1a1a" stroke-width="2"/>`;
      if (v.mouth === "smirk") mouthSvg = `<path d="M42 58 Q50 58 58 55" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      if (v.mouth === "open") mouthSvg = `<ellipse cx="50" cy="58" rx="6" ry="8" fill="#1a1a1a"/>`;
      if (v.mouth === "dot") mouthSvg = `<circle cx="50" cy="58" r="3" fill="#1a1a1a"/>`;
      if (v.mouth === "frown") mouthSvg = `<path d="M40 60 Q50 53 60 60" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      if (v.mouth === "wobbly") mouthSvg = `<path d="M40 58 Q45 62 50 58 T60 58" stroke="#1a1a1a" stroke-width="2" fill="none"/>`;
      if (v.mouth === "tongue") mouthSvg = `<path d="M40 55 Q50 55 60 55" stroke="#1a1a1a" stroke-width="2" fill="none"/><path d="M46 55 v4 a2,2 0 0 0 8,0 v-4" fill="#ff9999" stroke="#1a1a1a" stroke-width="1"/>`;

      // --- ASSEMBLE SVG ---
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" fill="${v.bg}" rx="20" />
          <circle cx="20" cy="35" r="12" fill="white" opacity="0.7"/>
          <circle cx="80" cy="35" r="12" fill="white" opacity="0.7"/>
          <ellipse cx="50" cy="55" rx="30" ry="35" fill="${v.body}" />
          <path d="M28 45 Q50 55 72 45" stroke="rgba(0,0,0,0.6)" stroke-width="5" fill="none" stroke-linecap="round" />
          <path d="M25 60 Q50 70 75 60" stroke="rgba(0,0,0,0.6)" stroke-width="5" fill="none" stroke-linecap="round" />
          <path d="M35 75 Q50 80 65 75" stroke="rgba(0,0,0,0.6)" stroke-width="5" fill="none" stroke-linecap="round" />
          <circle cx="30" cy="50" r="4" fill="#ff9999" opacity="0.6"/>
          <circle cx="70" cy="50" r="4" fill="#ff9999" opacity="0.6"/>
          <path d="M40 25 Q35 10 25 15" stroke="#2a2a2a" stroke-width="2" fill="none" />
          <path d="M60 25 Q65 10 75 15" stroke="#2a2a2a" stroke-width="2" fill="none" />
          <circle cx="25" cy="15" r="3" fill="#2a2a2a"/>
          <circle cx="75" cy="15" r="3" fill="#2a2a2a"/>
          ${eyesSvg}
          ${mouthSvg}
        </svg>
      `.trim();

      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    });

    setBeeAvatars(generated);
  }, []);

  return (
    <div className="avatars-grid">
      {beeAvatars.map((avatar, index) => {
        const isSelected = selected === avatar;
        return (
          <div
            key={index}
            className="avatar-item"
            onClick={() => onSelect(avatar)}
            style={{
              // Force styles for immediate feedback
              borderColor: isSelected ? "#6366f1" : "transparent",
              backgroundColor: isSelected ? "#e0e7ff" : "white",
              transform: isSelected ? "scale(1.15)" : "scale(1)",
              boxShadow: isSelected ? "0 10px 25px rgba(99, 102, 241, 0.4)" : "none"
            }}
          >
            <img src={avatar} alt={`BanterBee ${index + 1}`} />
          </div>
        );
      })}
    </div>
  );
};

export default AvatarPicker;