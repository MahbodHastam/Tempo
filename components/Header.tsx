
import React from 'react';
import { Icons } from '../constants';
import { formatCurrency } from '../utils';

interface HeaderProps {
  totalBilled: number;
  currency: 'USD' | 'IRT';
  onExport: () => void;
  onSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ totalBilled, currency, onExport, onSettings }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
        <h1 className="text-xl font-bold tracking-tight">Tempo</h1>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <button 
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <Icons.Download className="w-4 h-4" /> Export
        </button>

        <button 
          onClick={onSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <Icons.Cog className="w-4 h-4" /> Settings
        </button>

        <div className="h-4 w-px bg-gray-200 mx-1" />

        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
           <span className="text-gray-400">Total Billed:</span>
           <span className="text-gray-900 font-bold">
             {formatCurrency(totalBilled, currency)}
           </span>
        </div>
      </div>
    </header>
  );
};
