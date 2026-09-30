import React from 'react';

export default function LiveBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#fafafa] dark:bg-[#07090e] transition-colors duration-1000">
      {/* Static Ambient Radial Gradients for zero mobile lag */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[80vw] sm:w-[50vw] h-[80vw] sm:h-[50vw] rounded-full bg-gradient-to-br from-indigo-200/50 via-sky-200/30 to-transparent dark:from-indigo-900/20 dark:via-slate-800/20 dark:to-transparent blur-[60px] sm:blur-[100px] transform-gpu pointer-events-none"
      />
      
      <div 
        className="absolute top-[30%] -right-[15%] w-[80vw] sm:w-[45vw] h-[80vw] sm:h-[45vw] rounded-full bg-gradient-to-bl from-blue-200/40 via-purple-200/20 to-transparent dark:from-blue-900/20 dark:via-purple-900/20 dark:to-transparent blur-[60px] sm:blur-[100px] transform-gpu pointer-events-none"
      />

      <div 
        className="absolute -bottom-[10%] left-[10%] w-[90vw] sm:w-[60vw] h-[90vw] sm:h-[60vw] rounded-full bg-gradient-to-t from-sky-200/40 via-indigo-100/20 to-transparent dark:from-sky-900/20 dark:to-transparent blur-[70px] sm:blur-[120px] transform-gpu pointer-events-none"
      />

      {/* Subtle Pattern Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 0h2v2H5V1zm4 0h2v2H9V1zm4 0h2v2h-2V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />

      {/* Vignette Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafafa] dark:to-[#07090e] opacity-80 pointer-events-none" />
    </div>
  );
}
