
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
    timeoutRef.current = window.setTimeout(() => setVisible(true), 400);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <div className="relative flex items-center" onMouseEnter={show} onMouseLeave={hide} onFocusCapture={show} onBlurCapture={hide}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] tooltip-content pointer-events-none">
          <div className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-xl flex items-center gap-1.5">
            <span>{content}</span>
            {shortcut && (
              <span className="bg-gray-700 px-1 rounded text-[9px] uppercase">{shortcut}</span>
            )}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};
