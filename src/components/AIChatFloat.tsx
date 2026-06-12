import React, { useState } from 'react';
import AIChatPopup from "./AIChatPopup";

const AIChatFloat = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-[5.5rem] right-6 z-[9999] flex items-center justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center w-10 h-10 transition-all duration-300 hover:scale-110 active:scale-95 group"
          aria-label="Toggle AI Assistant"
        >
          {/* Ripple/Pulse Effect Layers */}
          <span className="absolute inset-0 bg-brand-red rounded-full opacity-40 animate-ping" />
          <span className="absolute -inset-1.5 bg-brand-red rounded-full opacity-20 animate-pulse duration-2000" />

          {/* Main Button Container */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible bg-background border border-border rounded-full shadow-xl">
            {/* Signal Red Status Indicator */}
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-brand-red rounded-full border-2 border-white shadow-[0_0_8px_#ef4444] z-20 animate-pulse" />

            {/* AI Chatroom Icon */}
            <img
              src="/home/chatroom.png"
              alt="AI Assistant"
              className="w-7 h-7 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          {/* Tooltip Label */}
          <div className="absolute right-full mr-4 bg-black/90 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none backdrop-blur-md border border-white/10 translate-x-2 group-hover:translate-x-0 shadow-2xl">
            AI Assistant
          </div>
        </button>
      </div>

      <AIChatPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIChatFloat;
