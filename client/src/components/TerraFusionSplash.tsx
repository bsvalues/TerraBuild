import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerraFusionSplashProps {
  onComplete?: () => void;
  duration?: number;
}

const TerraFusionSplash: React.FC<TerraFusionSplashProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="topographicPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M0 5 Q2.5 2.5 5 5 Q7.5 7.5 10 5" stroke="#00e5ff" strokeWidth="0.2" fill="none" opacity="0.3"/>
                  <path d="M0 8 Q2.5 6 5 8 Q7.5 10 10 8" stroke="#00e5ff" strokeWidth="0.2" fill="none" opacity="0.2"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#topographicPattern)"/>
            </svg>
          </div>

          <div className="text-center z-10">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <img 
                src="/assets/terrafusion-logo.png" 
                alt="TerraFusion Logo" 
                className="w-64 h-auto mx-auto drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 30px rgba(0, 229, 255, 0.5))' }}
              />
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-6xl font-bold text-white mb-4 tracking-tight"
            >
              TerraFusion
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-2xl text-cyan-400 font-medium mb-8"
            >
              AI That Understands Land
            </motion.p>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="text-lg text-slate-300 max-w-md mx-auto"
            >
              Advanced Geospatial Property Valuation Platform
            </motion.p>

            {/* Loading animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="mt-12"
            >
              <div className="flex justify-center items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-cyan-400 text-sm mt-4 font-medium">Initializing TerraFusion Platform...</p>
            </motion.div>
          </div>

          {/* Ambient glow effect */}
          <div className="absolute inset-0 bg-gradient-radial from-cyan-400/10 via-transparent to-transparent"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TerraFusionSplash;