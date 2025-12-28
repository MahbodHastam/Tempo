import React from 'react';
import { TimeEntry, Project } from '../types';
import { groupEntriesByDate, formatDuration } from '../utils';
import { Icons } from '../constants';
import { EntryRow } from './EntryRow';

interface HistoryListProps {
  entries: TimeEntry[];
  projects: Project[];
  currency: 'USD' | 'IRT';
  selectedIds: Set<string>;
  onToggleSelectId: (id: string) => void;
  onToggleSelectGroup: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onContinue: (entry: TimeEntry) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onUpdateEntryTime: (id: string, start: number, end?: number) => boolean;
  onToggleBillable: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  entries,
  projects,
  currency,
  selectedIds,
  onToggleSelectId,
  onToggleSelectGroup,
  onDelete,
  onContinue,
  onUpdateDescription,
  onUpdateEntryTime,
  onToggleBillable
}) => {
  const sortedGroups = groupEntriesByDate<TimeEntry>(entries);

  // Get date strings and sort them reverse chronologically
  const sortedDateKeys = Object.keys(sortedGroups).sort((a, b) => {
    return new Date(sortedGroups[b][0].startTime).getTime() - new Date(sortedGroups[a][0].startTime).getTime();
  });

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
    <div className="space-y-12 pb-24">
      {sortedDateKeys.map((date) => {
        const groupEntries = sortedGroups[date].sort((a, b) => b.startTime - a.startTime);
        const dateTotal = groupEntries.reduce((acc, curr) => acc + ((curr.endTime || curr.startTime) - curr.startTime), 0);
        const groupIds = groupEntries.map(e => e.id);
        const allInGroupSelected = groupIds.every(id => selectedIds.has(id));

        return (
          <div key={date} className="animate-modal">
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleSelectGroup(groupIds)}
                  className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                    allInGroupSelected 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-200 dark:border-dark-border hover:border-blue-400'
                  }`}
                >
                  {allInGroupSelected && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{date}</h3>
              </div>
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center gap-2">
                <span className="text-[10px] opacity-50">Day Total</span> 
                <span className="tabular-nums font-mono text-gray-600 dark:text-gray-300">{formatDuration(dateTotal)}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border divide-y divide-gray-100 dark:divide-dark-border transition-all">
              {groupEntries.map((entry, index) => (
                <EntryRow 
                  key={entry.id}
                  entry={entry}
                  project={projects.find(p => p.id === entry.projectId)}
                  currency={currency}
                  isSelected={selectedIds.has(entry.id)}
                  onSelectToggle={onToggleSelectId}
                  /* Fixed: Changed deleteEntry to onDelete as per HistoryListProps */
                  onDelete={onDelete}
                  onContinue={onContinue}
                  onUpdateDescription={onUpdateDescription}
                  onUpdateEntryTime={onUpdateEntryTime}
                  onToggleBillable={onToggleBillable}
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