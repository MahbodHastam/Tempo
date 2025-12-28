import React, { useState, useMemo } from 'react';
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
  onAddManual: (from: string, to: string) => boolean;
  checkConflict: (startTime: number, endTime: number) => boolean;
  descInputRef: React.RefObject<HTMLInputElement>;
  projectSelectRef: React.RefObject<HTMLSelectElement>;
}

const getDefaultFrom = () => {
  const d = new Date();
  d.setHours(d.getHours() - 1);
  return d.toTimeString().slice(0, 5);
};

const getDefaultTo = () => {
  return new Date().toTimeString().slice(0, 5);
};

export const TrackerBar: React.FC<TrackerBarProps> = ({
  activeEntry,
  elapsed,
  projects,
  onUpdateActive,
  onNewProject,
  onStart,
  onStop,
  onAddManual,
  checkConflict,
  descInputRef,
  projectSelectRef
}) => {
  const [isManual, setIsManual] = useState(false);
  const [manualFrom, setManualFrom] = useState(getDefaultFrom);
  const [manualTo, setManualTo] = useState(getDefaultTo);

  const isRunning = !!activeEntry?.startTime;

  const hasConflict = useMemo(() => {
    if (!isManual) return false;
    const today = new Date();
    const [fromH, fromM] = manualFrom.split(':').map(Number);
    const [toH, toM] = manualTo.split(':').map(Number);
    const start = new Date(today.setHours(fromH, fromM, 0, 0)).getTime();
    let end = new Date(today.setHours(toH, toM, 0, 0)).getTime();
    if (end <= start) end += 24 * 60 * 60 * 1000;
    return checkConflict(start, end);
  }, [manualFrom, manualTo, isManual, checkConflict]);

  const handleManualAdd = () => {
    if (hasConflict) return;
    const success = onAddManual(manualFrom, manualTo);
    if (success) {
      const now = getDefaultTo();
      setManualFrom(now);
      setManualTo(now);
    }
  };

  const calculateManualDuration = () => {
    const [fromH, fromM] = manualFrom.split(':').map(Number);
    const [toH, toM] = manualTo.split(':').map(Number);
    let diff = (toH * 60 + toM) - (fromH * 60 + fromM);
    if (diff < 0) diff += 24 * 60; // Next day
    return formatDuration(diff * 60 * 1000);
  };

  return (
    <div className="transition-all duration-300">
      {/* Main Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center py-1 gap-2">
        <div className="flex-1 flex items-center px-2 gap-3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 py-2">
          <input 
            ref={descInputRef}
            type="text" 
            placeholder="What are you working on?"
            className="w-full focus:outline-none bg-transparent text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 text-lg font-medium"
            value={activeEntry?.description || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (isManual) {
                  handleManualAdd();
                } else {
                  activeEntry?.startTime ? onStop() : onStart();
                }
              }
            }}
            onChange={(e) => onUpdateActive({ description: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 px-2 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 py-2">
           <Tooltip content="Select Project" shortcut="P">
             <select 
               ref={projectSelectRef}
               className="bg-transparent text-sm font-bold text-gray-500 dark:text-slate-400 focus:outline-none cursor-pointer px-2 py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
              className="p-1.5 text-gray-300 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300 transition-colors"
             >
               <Icons.Folder className="w-5 h-5" />
             </button>
           </Tooltip>
        </div>

        <div className="flex items-center gap-4 px-4 py-2">
          <Tooltip content="Toggle Billable" shortcut="B">
            <button 
              onClick={() => onUpdateActive({ isBillable: !activeEntry?.isBillable })}
              className={`p-2 rounded-xl transition-all ${activeEntry?.isBillable ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' : 'text-gray-300 dark:text-slate-600 hover:text-gray-400 dark:hover:text-slate-400'}`}
            >
              <Icons.Dollar className="w-5 h-5" />
            </button>
          </Tooltip>

          <div className="text-2xl font-mono tabular-nums text-gray-900 dark:text-slate-100 font-bold min-w-[110px] text-center">
            {isManual ? calculateManualDuration() : formatDuration(elapsed)}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning && (
               <Tooltip content={isManual ? "Switch to Timer" : "Switch to Manual"}>
                 <button 
                  onClick={() => setIsManual(!isManual)}
                  className={`p-2 rounded-xl transition-all border border-gray-100 dark:border-slate-800 ${isManual ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </button>
               </Tooltip>
            )}

            <div className="relative overflow-hidden rounded-xl min-w-[100px] h-[44px]">
              {isManual ? (
                <button 
                  onClick={handleManualAdd}
                  disabled={hasConflict}
                  className={`absolute inset-0 bg-blue-600 hover:bg-blue-700 text-white font-black transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-95 text-sm uppercase tracking-wider flex items-center justify-center ${hasConflict ? 'opacity-50 cursor-not-allowed grayscale' : 'opacity-100'}`}
                >
                  ADD
                </button>
              ) : isRunning ? (
                <button 
                  onClick={onStop}
                  className="absolute inset-0 bg-red-500 hover:bg-red-600 text-white font-black transition-all duration-300 shadow-lg shadow-red-500/20 active:scale-95 text-sm uppercase tracking-wider flex items-center justify-center"
                >
                  STOP
                </button>
              ) : (
                <button 
                  onClick={onStart}
                  className="absolute inset-0 bg-blue-600 hover:bg-blue-700 text-white font-black transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-95 text-sm uppercase tracking-wider flex items-center justify-center"
                >
                  START
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Row */}
      {isManual && !isRunning && (
        <div className="bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 px-6 py-4 flex flex-col items-center justify-center gap-3 animate-modal rounded-b-2xl">
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">From</label>
              <input 
                type="time" 
                value={manualFrom} 
                onChange={(e) => setManualFrom(e.target.value)}
                className={`bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm font-bold dark:text-slate-100 focus:outline-none focus:ring-4 transition-all cursor-pointer ${hasConflict ? 'border-red-400 focus:ring-red-500/10' : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500/10'}`}
              />
            </div>
            <div className="w-4 h-px bg-gray-300 dark:bg-slate-700 self-end mb-5"></div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">To</label>
              <input 
                type="time" 
                value={manualTo} 
                onChange={(e) => setManualTo(e.target.value)}
                className={`bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm font-bold dark:text-slate-100 focus:outline-none focus:ring-4 transition-all cursor-pointer ${hasConflict ? 'border-red-400 focus:ring-red-500/10' : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500/10'}`}
              />
            </div>
          </div>
          {hasConflict && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">Time range conflicts with an existing entry</p>
          )}
        </div>
      )}
    </div>
  );
};