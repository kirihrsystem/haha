import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
  key?: React.Key;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    // Lock scroll and force to top
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    
    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 1.2, ease: "easeOut" } }}
    >
      {/* Light Clean Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <motion.div 
          className="w-[80vw] h-[80vw] max-w-2xl max-h-2xl rounded-full opacity-60 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(226,232,240,0.8) 0%, rgba(255,255,255,0) 70%)'
          }}
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      <div className="relative z-10">
        <motion.div 
          className="relative w-48 h-48 md:w-72 md:h-72 flex items-center justify-center"
        >
          {/* Full Unified Logo */}
          <motion.div
            className="absolute inset-0 p-2 md:p-3 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.8 }}
          >
            <img fetchPriority="high" decoding="async" src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-xl" />
          </motion.div>
          
          {/* Assembling Slices Reveal */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 p-2 md:p-3"
              style={{
                clipPath: `inset(${i * 25}% 0 ${(3 - i) * 25}% 0)`
              }}
              initial={{ x: i % 2 === 0 ? -20 : 20, opacity: 0, filter: "blur(6px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{
                duration: 1.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.3 + (i * 0.15)
              }}
            >
              <motion.img 
                src="/logo.png" 
                alt="" 
                className="w-full h-full object-contain drop-shadow-xl"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 2.1 }}
              />
            </motion.div>
          ))}
          
          {/* Extended Glass Shimmer Sweep Effect */}
          <motion.div
            className="absolute inset-0 p-2 md:p-3 z-20 pointer-events-none"
            style={{
              WebkitMaskImage: 'url(/logo.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: 'url(/logo.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          >
            <motion.div
              className="absolute inset-y-0 w-[200%] bg-gradient-to-r from-transparent via-white/80 to-transparent"
              initial={{ left: "-200%", skewX: "-30deg" }}
              animate={{ left: "200%" }}
              transition={{ duration: 6.5, ease: "easeInOut", delay: 0.5 }}
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
