import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 1000,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const particles = Array.from({ length: 25 }).map((_, i) => {
    const size = Math.random() * 6 + 2;
    return {
      id: i,
      size,
      x: Math.random() * windowSize.width,
      y: Math.random() * windowSize.height,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    };
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Dynamic Blobs */}
      <motion.div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-ice-300/60 dark:bg-ice-900/40 blur-[100px] will-change-transform transform-gpu"
        animate={{
          x: [0, 80, 0, -80, 0],
          y: [0, 50, 100, 40, 0],
          scale: [1, 1.3, 1.1, 1.4, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-purple-300/60 dark:bg-purple-900/40 blur-[120px] will-change-transform transform-gpu"
        animate={{
          x: [0, -100, -30, -80, 0],
          y: [0, 100, -30, 60, 0],
          scale: [1, 1.6, 1.2, 1.5, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-200/70 dark:bg-blue-900/40 blur-[120px] will-change-transform transform-gpu"
        animate={{
          x: [0, 80, -50, 50, 0],
          y: [0, -80, 30, -50, 0],
          scale: [1, 1.4, 1.2, 1.5, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Floating Particles */}
      {particles.map((p, idx) => (
        <motion.div
          key={`${p.id}-${idx}`}
          className="absolute rounded-full bg-ice-500/30 dark:bg-ice-300/30 backdrop-blur-sm will-change-transform transform-gpu"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
          }}
          animate={{
            y: [0, -100, -200, -100, 0],
            x: [0, Math.random() * 50 - 25, Math.random() * 100 - 50, Math.random() * 50 - 25, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
