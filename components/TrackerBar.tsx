
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-2">
      <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-gray-100 py-2">
        <input 
          ref={descInputRef}
          type="text" 
          placeholder="What are you working on?"
          className="w-full focus:outline-none text-gray-800 placeholder-gray-400"
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

      <div className="flex items-center gap-2 px-2 border-b md:border-b-0 md:border-r border-gray-100 py-2">
         <Tooltip content="Select Project" shortcut="P">
           <select 
             ref={projectSelectRef}
             className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer px-2"
             value={activeEntry?.projectId || ''}
             onChange={(e) => onUpdateActive({ projectId: e.target.value })}
           >
             <option value="">+ Project</option>
             {projects.map(p => (
               <option key={p.id} value={p.id}>{p.name}</option>
             ))}
           </select>
         </Tooltip>
         <Tooltip content="New Project" shortcut="N">
           <button 
            onClick={onNewProject}
            className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
           >
             <Icons.Folder className="w-4 h-4" />
           </button>
         </Tooltip>
      </div>

      <div className="flex items-center gap-4 px-4 py-2">
        <Tooltip content="Toggle Billable" shortcut="B">
          <button 
            onClick={() => onUpdateActive({ isBillable: !activeEntry?.isBillable })}
            className={`p-1.5 rounded-full transition-colors ${activeEntry?.isBillable ? 'text-blue-600 bg-blue-50' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <Icons.Dollar className="w-5 h-5" />
          </button>
        </Tooltip>

        <div className="text-xl font-mono tabular-nums text-gray-900 min-w-[100px] text-center">
          {formatDuration(elapsed)}
        </div>

        {activeEntry?.startTime ? (
          <Tooltip content="Stop Timer" shortcut="S">
            <button 
              onClick={onStop}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-red-200 active:scale-95"
            >
              STOP
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Start Timer" shortcut="S">
            <button 
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-blue-200 active:scale-95"
            >
              START
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
