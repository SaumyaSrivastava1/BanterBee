// import axios from "axios";

// // Check if we are running locally or on the web
// const isDevelopment = window.location.hostname === "localhost";

// // Automatically switch URLs
// const api = axios.create({
//   baseURL: isDevelopment 
//     ? "http://localhost:5001" 
//     : "https://banterbee-api.onrender.com", // You will verify this URL after deploying to Render
// });

// api.interceptors.request.use(
//   (config) => {
//     let token = null;

//     // new key: chatUser = { user, token }
//     const saved = localStorage.getItem("chatUser");
//     if (saved) {
//       try {
//         const parsed = JSON.parse(saved);
//         token = parsed.token;
//       } catch {
//         token = null;
//       }
//     }

//     // backward-compatibility
//     if (!token) {
//       token = localStorage.getItem("token");
//     }

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default api;

import axios from "axios";

const isDevelopment = window.location.hostname === "localhost";

const api = axios.create({
  baseURL: isDevelopment 
  ? "http://localhost:5001" 
  : "https://banterbee.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    let token = null;

    const saved = localStorage.getItem("chatUser");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        token = parsed.token;
      } catch {
        token = null;
      }
    }

    if (!token) {
      token = localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;