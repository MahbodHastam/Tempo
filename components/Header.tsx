
import React from 'react';
import { Icons } from '../constants';
import { formatCurrency } from '../utils';
import { ThemeMode } from '../types';
import { Tooltip } from './Tooltip';

interface HeaderProps {
  totalBilled: number;
  currency: 'USD' | 'IRT';
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onExport: () => void;
  onSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  totalBilled, 
  currency, 
  themeMode,
  onToggleTheme,
  onExport, 
  onSettings 
}) => {
  const ThemeIcon = themeMode === 'light' ? Icons.Sun : themeMode === 'dark' ? Icons.Moon : Icons.Monitor;

  return (
    <header className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-border sticky top-0 z-40 px-6 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">T</div>
        <h1 className="text-xl font-black tracking-tight dark:text-white">Tempo</h1>
      </div>
      
      <div className="flex items-center gap-1 text-sm font-medium">
        <Tooltip content={`Theme: ${themeMode}`} shortcut="T">
          <button 
            onClick={onToggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            <ThemeIcon className="w-5 h-5" />
          </button>
        </Tooltip>

        <div className="w-px h-4 bg-gray-200 dark:bg-dark-border mx-1" />

        <button 
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-600 dark:text-gray-400 font-bold"
        >
          <Icons.Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
        </button>

        <button 
          onClick={onSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-600 dark:text-gray-400 font-bold"
        >
          <Icons.Cog className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span>
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-dark-border mx-2 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-black/20 px-3 py-1.5 rounded-full border border-gray-100 dark:border-dark-border">
           <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-tight">Total Billed</span>
           <span className="text-gray-900 dark:text-white font-black text-sm tabular-nums">
             {formatCurrency(totalBilled, currency)}
           </span>
        </div>
      </div>
    </header>
  );
};
