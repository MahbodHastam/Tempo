import React, { useState, useEffect, useRef } from 'react';
import { TimeEntry, Project } from '../types';
import { Icons } from '../constants';
import { formatDuration, formatCurrency } from '../utils';

interface EntryRowProps {
  entry: TimeEntry;
  project?: Project;
  currency: 'USD' | 'IRT';
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  className?: string;
  onDelete: (id: string) => void;
  onContinue: (entry: TimeEntry) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onUpdateEntryTime: (id: string, start: number, end?: number) => boolean;
  onToggleBillable: (id: string) => void;
}

export const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  project,
  currency,
  isSelected,
  onSelectToggle,
  className = '',
  onDelete,
  onContinue,
  onUpdateDescription,
  onUpdateEntryTime,
  onToggleBillable
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [desc, setDesc] = useState(entry.description);
  
  const timePopoverRef = useRef<HTMLDivElement>(null);

  const formatTimeInput = (timestamp: number) => {
    return new Date(timestamp).toTimeString().slice(0, 5);
  };

  const [editFrom, setEditFrom] = useState(formatTimeInput(entry.startTime));
  const [editTo, setEditTo] = useState(entry.endTime ? formatTimeInput(entry.endTime) : '');

  const duration = (entry.endTime || entry.startTime) - entry.startTime;

  useEffect(() => {
    if (!showDeleteConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onDelete(entry.id);
        setShowDeleteConfirm(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDeleteConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirm, entry.id, onDelete]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timePopoverRef.current && !timePopoverRef.current.contains(e.target as Node)) {
        setShowTimeEdit(false);
      }
    };
    if (showTimeEdit) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTimeEdit]);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateDescription(entry.id, desc);
  };

  const handleTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datePart = new Date(entry.startTime);
    const [fH, fM] = editFrom.split(':').map(Number);
    const start = new Date(datePart.setHours(fH, fM, 0, 0)).getTime();
    
    let end: number | undefined = undefined;
    if (entry.endTime) {
      const [tH, tM] = editTo.split(':').map(Number);
      end = new Date(datePart.setHours(tH, tM, 0, 0)).getTime();
      if (end <= start) end += 24 * 60 * 60 * 1000;
    }

    if (onUpdateEntryTime(entry.id, start, end)) {
      setShowTimeEdit(false);
    }
  };

  const itemCurrency = project?.currency || currency;

  return (
    <div className={`group hover:bg-gray-50/50 dark:hover:bg-white/[0.03] flex items-center px-6 py-4 transition-colors relative ${isSelected ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''} ${className}`}>
      {/* Circular Checkbox */}
      <div className="mr-4 flex-shrink-0">
        <button
          onClick={() => onSelectToggle(entry.id)}
          className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
            isSelected 
              ? 'bg-blue-500 border-blue-500 shadow-sm' 
              : 'border-gray-200 dark:border-dark-border hover:border-blue-400 dark:hover:border-blue-500/50'
          }`}
        >
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0 pr-4">
        {isEditing ? (
          <input
            autoFocus
            className="w-full bg-white dark:bg-dark-muted border border-blue-200 dark:border-blue-500/30 rounded px-2 py-0.5 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          />
        ) : (
          <p 
            onClick={() => setIsEditing(true)}
            className="text-gray-900 dark:text-[#fdfaf7] font-bold truncate mb-1 cursor-text hover:bg-gray-100/50 dark:hover:bg-white/5 rounded transition-colors px-1 -ml-1"
          >
            {entry.description || <span className="text-gray-300 dark:text-gray-600 italic font-medium">No description</span>}
          </p>
        )}
        {project && (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: project.color }} />
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight">{project.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-8 ml-4">
        <button 
          onClick={() => onToggleBillable(entry.id)}
          className={`p-2 rounded-lg transition-colors ${entry.isBillable ? 'text-blue-500 bg-blue-500/5 hover:bg-blue-500/10' : 'text-gray-200 dark:text-gray-700 hover:text-gray-400'}`}
        >
          <Icons.Dollar className="w-5 h-5" />
        </button>
        
        <div className="text-right hidden sm:block relative">
          <button 
            onClick={() => setShowTimeEdit(!showTimeEdit)}
            className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase hover:text-blue-500 transition-colors"
          >
            {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
            {entry.endTime ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
          </button>

          {showTimeEdit && (
            <div 
              ref={timePopoverRef}
              className="absolute right-0 bottom-full mb-3 z-[100] bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border shadow-2xl rounded-2xl p-4 min-w-[200px] animate-modal"
            >
              <form onSubmit={handleTimeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">From</label>
                    <input 
                      type="time" 
                      value={editFrom}
                      onChange={(e) => setEditFrom(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-dark-border rounded-lg px-2 py-1.5 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">To</label>
                    <input 
                      type="time" 
                      value={editTo}
                      disabled={!entry.endTime}
                      onChange={(e) => setEditTo(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-dark-border rounded-lg px-2 py-1.5 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-30"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-blue-700 transition-colors">Apply</button>
                  <button type="button" onClick={() => setShowTimeEdit(false)} className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg">Cancel</button>
                </div>
              </form>
              <div className="w-2.5 h-2.5 bg-white dark:bg-dark-surface border-r border-b border-gray-100 dark:border-dark-border rotate-45 absolute -bottom-1.5 right-6"></div>
            </div>
          )}
        </div>

        <div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200 tabular-nums min-w-[80px] text-right">
          {formatDuration(duration)}
        </div>

        {entry.isBillable && (
            <div className="text-right min-w-[80px]">
                <p className="text-sm font-black text-gray-900 dark:text-white">
                    {formatCurrency((duration / 3600000) * entry.hourlyRate, itemCurrency)}
                </p>
            </div>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
          <button 
            onClick={() => onContinue(entry)}
            className="p-2 text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Icons.Play className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className={`p-2 transition-colors ${showDeleteConfirm ? 'text-red-500' : 'text-gray-400 dark:text-gray-400 hover:text-red-400'}`}
            >
              <Icons.Trash className="w-5 h-5" />
            </button>

            {showDeleteConfirm && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setShowDeleteConfirm(false)} />
                <div className="absolute right-0 bottom-full mb-2 z-[50] bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border shadow-2xl rounded-xl p-2 min-w-[140px] animate-modal">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight px-2 mb-2">Confirm Delete?</p>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => onDelete(entry.id)}
                      className="w-full text-left px-3 py-1.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Delete (Enter)
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full text-left px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Cancel (Esc)
                    </button>
                  </div>
                  <div className="w-2.5 h-2.5 bg-white dark:bg-dark-surface border-r border-b border-gray-100 dark:border-dark-border rotate-45 absolute -bottom-1.5 right-3"></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};