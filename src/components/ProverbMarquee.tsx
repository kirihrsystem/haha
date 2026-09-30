import React from 'react';
import { motion } from 'motion/react';
import { allProverbs } from '../data/proverbs';

// Simple deterministic shuffle so it doesn't cause hydration mismatch if SSR (though we are SPA)
const shuffled = [...allProverbs].sort((a, b) => 0.5 - Math.random());
// Duplicate the array exactly once so that translating by -50% shifts exactly one full set.
const repeatedProverbs = [...shuffled, ...shuffled];

export const ProverbMarquee: React.FC = () => {
  return (
    <div className="w-full overflow-hidden bg-slate-950 text-white py-6 sm:py-8 border-t border-white/5 flex items-center relative">
      {/* Gradient fades on left and right for seamless look */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>
      
      <motion.div
        className="flex whitespace-nowrap w-max"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 2500, // Very slow scroll for reading
          ease: "linear",
        }}
      >
        {repeatedProverbs.map((proverb, index) => (
          <div key={index} className="flex items-center">
            <span className="text-[18px] sm:text-[16px] font-kasaet font-light italic tracking-wide text-white/80 hover:text-white transition-colors duration-300 px-12 sm:px-24">
              {proverb}
            </span>
            <span className="text-white/20 text-xs">✦</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
