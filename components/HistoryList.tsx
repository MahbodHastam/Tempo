
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
      <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
           <Icons.Play className="w-6 h-6 text-gray-300" />
         </div>
         <p className="text-gray-400 font-medium">No time entries yet. Press <span className="bg-gray-200 px-1 rounded mx-1">S</span> to start tracking!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(sortedGroups).map(([date, groupEntries]) => {
        const dateTotal = groupEntries.reduce((acc, curr) => acc + ((curr.endTime || curr.startTime) - curr.startTime), 0);
        return (
          <div key={date}>
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{date}</h3>
              <div className="text-sm font-bold text-gray-400">Total: {formatDuration(dateTotal)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {groupEntries.map(entry => (
                <EntryRow 
                  key={entry.id}
                  entry={entry}
                  project={projects.find(p => p.id === entry.projectId)}
                  currency={currency}
                  onDelete={onDelete}
                  onContinue={onContinue}
                  onUpdateDescription={onUpdateDescription}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
