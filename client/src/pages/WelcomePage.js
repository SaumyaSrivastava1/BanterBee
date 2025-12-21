import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; 
import { AuthContext } from "../context/AuthContext"; 
import logo from "../assets/logo.png"; 
import "./WelcomePage.css"; 

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.8, when: "beforeChildren", staggerChildren: 0.3 } 
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120 } },
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0, 
      transition: { type: "spring", stiffness: 150, damping: 10, delay: 0.2 } 
    },
  };

  return (
    <motion.div 
      className="welcome-bg"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="welcome-content" variants={itemVariants}>
        <motion.img 
          src={logo} 
          alt="BanterBee Logo" 
          className="welcome-logo"
          variants={logoVariants}
        />
        
        <motion.div className="welcome-badge" variants={itemVariants}>
          ✨ Your New Favorite Spot
        </motion.div>

        <motion.h1 className="welcome-title" variants={itemVariants}>
          Welcome to <span className="highlight">BanterBee</span>
        </motion.h1>
        
        <motion.p className="welcome-subtitle" variants={itemVariants}>
          A delightful, cosy corner of the internet designed just for you. 
          Pick a cute avatar, find your friends, and start buzzing with real-time 
          conversations. It's simple, fast, and fun.
        </motion.p>
        
        <motion.div className="tech-stack" variants={itemVariants}>
          <p>Built with modern MERN Stack + Socket.io for instant messaging. 🚀</p>
        </motion.div>

        <motion.div className="welcome-actions" variants={itemVariants}>
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/register")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
          
          <motion.button 
            className="btn btn-secondary btn-lg" 
            onClick={() => navigate("/login")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            I have an account
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomePage;