import React from 'react';
import { formatDuration, formatCurrency } from '../utils';
import { Icons } from '../constants';

interface SelectionBarProps {
  selectedCount: number;
  totalDuration: number;
  totalBilledByCurrency: Record<string, number>;
  onExport: () => void;
  onClear: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  totalDuration,
  totalBilledByCurrency,
  onExport,
  onClear
}) => {
  if (selectedCount === 0) return null;

  const currencies = Object.keys(totalBilledByCurrency);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-2xl animate-modal">
      <div className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-lg border border-gray-200 dark:border-dark-border shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 divide-x divide-gray-100 dark:divide-dark-border">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Selected</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}</span>
          </div>
          <div className="pl-6 flex flex-col">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Time</span>
            <span className="text-sm font-mono font-bold dark:text-white">{formatDuration(totalDuration)}</span>
          </div>
          <div className="pl-6 flex flex-col hidden sm:flex gap-1">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Billable</span>
            <div className="flex flex-col">
              {currencies.length > 0 ? (
                currencies.map(curr => (
                  <span key={curr} className="text-xs font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalBilledByCurrency[curr], curr as 'USD' | 'IRT')}
                  </span>
                ))
              ) : (
                <span className="text-sm font-bold text-gray-400 dark:text-gray-600">-</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onClear}
            className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Clear Selection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            onClick={onExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm"
          >
            <Icons.Download className="w-4 h-4" />
            <span>Export Selected</span>
          </button>
        </div>
      </div>
    </div>
  );
};