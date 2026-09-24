import React from 'react';

interface CountdownProps {
  count: number;
}

export const Countdown: React.FC<CountdownProps> = ({ count }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-pop">
      <div className="text-center">
        <span className="text-party-yellow font-black text-9xl md:text-[14rem] tracking-tighter drop-shadow-[0_10px_20px_rgba(255,222,89,0.5)] animate-bounce-short inline-block">
          {count > 0 ? count : 'GO!'}
        </span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mt-4 uppercase tracking-widest">
          {count > 0 ? 'Hazır Ol...' : 'Hemen Başla!'}
        </h2>
      </div>
    </div>
  );
};
