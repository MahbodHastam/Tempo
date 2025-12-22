import React from 'react';
import { TimeEntry, Project } from '../types';
import { groupEntriesByDate, formatDuration } from '../utils';
import { Icons } from '../constants';
import { EntryRow } from './EntryRow';

interface HistoryListProps {
  entries: TimeEntry[];
  projects: Project[];
  currency: 'USD' | 'IRT';
  onDelete: (id: string) => void;
  onContinue: (entry: TimeEntry) => void;
  onUpdateDescription: (id: string, description: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  entries,
  projects,
  currency,
  onDelete,
  onContinue,
  onUpdateDescription
}) => {
  const sortedGroups = groupEntriesByDate<TimeEntry>(entries);

  if (entries.length === 0) {
    return (
      <div className="text-center py-24 bg-gray-50/50 dark:bg-dark-surface/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-dark-border">
         <div className="w-16 h-16 bg-white dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50 dark:border-dark-border">
           <Icons.Play className="w-6 h-6 text-gray-300 dark:text-gray-600" />
         </div>
         <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">Your timeline is empty</p>
         <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Start the timer or press <span className="bg-gray-200 dark:bg-dark-border px-1.5 py-0.5 rounded mx-1 text-gray-600 dark:text-gray-300 font-mono text-xs">S</span> to begin tracking.
         </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(sortedGroups).map(([date, groupEntries]) => {
        const dateTotal = groupEntries.reduce((acc, curr) => acc + ((curr.endTime || curr.startTime) - curr.startTime), 0);
        return (
          <div key={date} className="animate-modal">
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{date}</h3>
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center gap-2">
                <span className="text-[10px] opacity-50">Day Total</span> 
                <span className="tabular-nums font-mono text-gray-600 dark:text-gray-300">{formatDuration(dateTotal)}</span>
              </div>
            </div>
            {/* Removed overflow-hidden to allow popovers to escape container bounds */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border divide-y divide-gray-100 dark:divide-dark-border transition-all">
              {groupEntries.map((entry, index) => (
                <EntryRow 
                  key={entry.id}
                  entry={entry}
                  project={projects.find(p => p.id === entry.projectId)}
                  currency={currency}
                  onDelete={onDelete}
                  onContinue={onContinue}
                  onUpdateDescription={onUpdateDescription}
                  // Inject specific rounding to maintain the "card" look without overflow-hidden
                  className={`
                    ${index === 0 ? 'rounded-t-2xl' : ''} 
                    ${index === groupEntries.length - 1 ? 'rounded-b-2xl' : ''}
                  `}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};