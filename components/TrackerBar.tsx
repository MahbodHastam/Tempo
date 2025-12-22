import React from 'react';
import { Icons } from '../constants';
import { Tooltip } from './Tooltip';
import { formatDuration } from '../utils';
import { Project, TimeEntry } from '../types';

interface TrackerBarProps {
  activeEntry: Partial<TimeEntry> | null;
  elapsed: number;
  projects: Project[];
  onUpdateActive: (updates: Partial<TimeEntry>) => void;
  onNewProject: () => void;
  onStart: () => void;
  onStop: () => void;
  descInputRef: React.RefObject<HTMLInputElement>;
  projectSelectRef: React.RefObject<HTMLSelectElement>;
}

export const TrackerBar: React.FC<TrackerBarProps> = ({
  activeEntry,
  elapsed,
  projects,
  onUpdateActive,
  onNewProject,
  onStart,
  onStop,
  descInputRef,
  projectSelectRef
}) => {
  const isRunning = !!activeEntry?.startTime;

  return (
    <div className={`rounded-2xl shadow-xl border transition-all duration-300 ${isRunning ? 'ring-2 ring-blue-500/20' : ''} bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border p-2 mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-2`}>
      <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-dark-border py-2">
        <input 
          ref={descInputRef}
          type="text" 
          placeholder="What are you working on?"
          className="w-full focus:outline-none bg-transparent text-gray-800 dark:text-[#fdfaf7] placeholder-gray-400 dark:placeholder-gray-600 text-lg font-medium"
          value={activeEntry?.description || ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              activeEntry?.startTime ? onStop() : onStart();
            }
          }}
          onChange={(e) => onUpdateActive({ description: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2 px-2 border-b md:border-b-0 md:border-r border-gray-100 dark:border-dark-border py-2">
         <Tooltip content="Select Project" shortcut="P">
           <select 
             ref={projectSelectRef}
             className="bg-transparent text-sm font-bold text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer px-2 py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
             value={activeEntry?.projectId || ''}
             onChange={(e) => onUpdateActive({ projectId: e.target.value })}
           >
             <option value="" className="dark:bg-dark-surface">+ Project</option>
             {projects.map(p => (
               <option key={p.id} value={p.id} className="dark:bg-dark-surface">{p.name}</option>
             ))}
           </select>
         </Tooltip>
         <Tooltip content="New Project" shortcut="N">
           <button 
            onClick={onNewProject}
            className="p-1.5 text-gray-300 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-200 transition-colors"
           >
             <Icons.Folder className="w-5 h-5" />
           </button>
         </Tooltip>
      </div>

      <div className="flex items-center gap-4 px-4 py-2">
        <Tooltip content="Toggle Billable" shortcut="B">
          <button 
            onClick={() => onUpdateActive({ isBillable: !activeEntry?.isBillable })}
            className={`p-2 rounded-xl transition-all ${activeEntry?.isBillable ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' : 'text-gray-300 dark:text-gray-500 hover:text-gray-400 dark:hover:text-gray-300'}`}
          >
            <Icons.Dollar className="w-5 h-5" />
          </button>
        </Tooltip>

        <div className="text-2xl font-mono tabular-nums text-gray-900 dark:text-[#fdfaf7] font-bold min-w-[110px] text-center">
          {formatDuration(elapsed)}
        </div>

        {activeEntry?.startTime ? (
          <Tooltip content="Stop Timer" shortcut="S">
            <button 
              onClick={onStop}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-red-500/20 active:scale-95 text-sm uppercase tracking-wider"
            >
              STOP
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Start Timer" shortcut="S">
            <button 
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm uppercase tracking-wider"
            >
              START
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};