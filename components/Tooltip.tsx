import React, { useState, useRef } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  shortcut?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, shortcut }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setVisible(true), 400);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <div 
      className="relative flex items-center justify-center w-fit h-fit" 
      onMouseEnter={show} 
      onMouseLeave={hide} 
      onFocusCapture={show} 
      onBlurCapture={hide}
    >
      {children}
      {visible && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] flex flex-col items-center pointer-events-none"
          style={{ width: 'max-content' }}
        >
          <div className="bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl flex items-center gap-1.5 tooltip-content">
            <span>{content}</span>
            {shortcut && (
              <span className="bg-white/20 px-1 rounded text-[9px] uppercase font-black">{shortcut}</span>
            )}
          </div>
          {/* Tooltip Arrow */}
          <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mt-1.5 shadow-sm"></div>
        </div>
      )}
    </div>
  );
};