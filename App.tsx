
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TimeEntry, Project, AppState, ThemeMode } from './types';
import { COLORS, Icons } from './constants';
import { formatDuration, generateId, formatCurrency } from './utils';
import { exportToPdf } from './services/exportService';
import { Header } from './components/Header';
import { TrackerBar } from './components/TrackerBar';
import { HistoryList } from './components/HistoryList';
import { SelectionBar } from './components/SelectionBar';
import { FilterBar } from './components/FilterBar';

const STORAGE_KEY = 'tempo_app_state_v2';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.preferredCurrency) parsed.preferredCurrency = 'USD';
        if (!parsed.themeMode) parsed.themeMode = 'system';
        return parsed;
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    return {
      entries: [],
      projects: [],
      activeEntry: null,
      defaultHourlyRate: 50,
      preferredCurrency: 'USD',
      themeMode: 'system'
    };
  });

  const [elapsed, setElapsed] = useState(0);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exportFilter, setExportFilter] = useState('all');
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectData, setEditProjectData] = useState<Partial<Project>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const descInputRef = useRef<HTMLInputElement>(null);
  const projectSelectRef = useRef<HTMLSelectElement>(null);

  const [settingsRate, setSettingsRate] = useState(state.defaultHourlyRate.toString());
  const [settingsCurrency, setSettingsCurrency] = useState(state.preferredCurrency);

  const isTimerRunning = !!state.activeEntry?.startTime;

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (mode: ThemeMode) => {
      const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(state.themeMode);

    if (state.themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [state.themeMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Handle flash effect when timer starts
  useEffect(() => {
    if (isTimerRunning) {
      setFlashTrigger(prev => prev + 1);
    }
  }, [isTimerRunning]);

  // Prevent accidental page leave while timer is running
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.activeEntry && state.activeEntry.startTime) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.activeEntry?.startTime]);

  useEffect(() => {
    if (showSettingsModal) {
      setSettingsRate(state.defaultHourlyRate.toString());
      setSettingsCurrency(state.preferredCurrency);
    }
  }, [showSettingsModal, state.defaultHourlyRate, state.preferredCurrency]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');

      if (e.key === 'Escape') {
        setShowProjectModal(false);
        setShowExportModal(false);
        setShowSettingsModal(false);
        setEditingProjectId(null);
        setSelectedIds(new Set());
      }

      if (isInputFocused) return;

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        state.activeEntry?.startTime ? stopTimer() : startTimer();
      }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setShowExportModal(true);
      }
      if (e.key === ',' || (e.metaKey && e.key === ',')) {
        e.preventDefault();
        setShowSettingsModal(true);
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        projectSelectRef.current?.focus();
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowProjectModal(true);
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        descInputRef.current?.focus();
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setShowFilters(prev => !prev);
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setState(prev => ({
          ...prev,
          activeEntry: prev.activeEntry ? { 
            ...prev.activeEntry, 
            isBillable: !prev.activeEntry.isBillable 
          } : null
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.activeEntry, showProjectModal, showExportModal, showSettingsModal]);

  useEffect(() => {
    let interval: number;
    if (state.activeEntry && state.activeEntry.startTime) {
      interval = window.setInterval(() => {
        setElapsed(Date.now() - (state.activeEntry?.startTime || 0));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [state.activeEntry]);

  useEffect(() => {
    if (state.activeEntry && state.activeEntry.startTime) {
      const duration = formatDuration(elapsed);
      const desc = state.activeEntry.description || 'Tracking';
      document.title = `${duration} | ${desc}`;
    } else {
      document.title = 'Tempo | Time Tracker';
    }
  }, [elapsed, state.activeEntry]);

  const startTimer = () => {
    const project = state.projects.find(p => p.id === state.activeEntry?.projectId);
    const entry: Partial<TimeEntry> = {
      id: generateId(),
      description: state.activeEntry?.description || '',
      startTime: Date.now(),
      isBillable: state.activeEntry?.isBillable ?? true,
      hourlyRate: project?.hourlyRate ?? state.defaultHourlyRate,
      projectId: state.activeEntry?.projectId
    };
    setState(prev => ({ ...prev, activeEntry: entry }));
  };

  const stopTimer = () => {
    if (!state.activeEntry) return;
    const completedEntry: TimeEntry = {
      ...(state.activeEntry as TimeEntry),
      endTime: Date.now()
    };
    setState(prev => ({
      ...prev,
      entries: [completedEntry, ...prev.entries],
      activeEntry: null
    }));
  };

  const checkConflict = useCallback((startTime: number, endTime: number, excludeId?: string) => {
    return state.entries.some(entry => {
      if (excludeId && entry.id === excludeId) return false;
      const eStart = entry.startTime;
      const eEnd = entry.endTime || Date.now();
      return (startTime < eEnd) && (eStart < endTime);
    });
  }, [state.entries]);

  const addManualEntry = (from: string, to: string) => {
    const today = new Date();
    const [fromH, fromM] = from.split(':').map(Number);
    const [toH, toM] = to.split(':').map(Number);
    
    const startTime = new Date(today.setHours(fromH, fromM, 0, 0)).getTime();
    let endTime = new Date(today.setHours(toH, toM, 0, 0)).getTime();

    if (endTime <= startTime) {
      endTime += 24 * 60 * 60 * 1000;
    }

    if (checkConflict(startTime, endTime)) {
      alert("This entry conflicts with an existing time entry.");
      return false;
    }

    const project = state.projects.find(p => p.id === state.activeEntry?.projectId);
    const manualEntry: TimeEntry = {
      id: generateId(),
      description: state.activeEntry?.description || '',
      startTime,
      endTime,
      isBillable: state.activeEntry?.isBillable ?? true,
      hourlyRate: project?.hourlyRate ?? state.defaultHourlyRate,
      projectId: state.activeEntry?.projectId
    };

    setState(prev => ({
      ...prev,
      entries: [manualEntry, ...prev.entries],
      activeEntry: null
    }));
    return true;
  };

  const continueEntry = (entry: TimeEntry) => {
    if (state.activeEntry?.startTime) stopTimer();
    const newEntry: Partial<TimeEntry> = {
      id: generateId(),
      description: entry.description,
      startTime: Date.now(),
      isBillable: entry.isBillable,
      hourlyRate: entry.hourlyRate,
      projectId: entry.projectId
    };
    setState(prev => ({ ...prev, activeEntry: newEntry }));
  };

  const updateEntryDescription = (id: string, description: string) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, description } : e)
    }));
  };

  const updateEntryTime = (id: string, startTime: number, endTime?: number) => {
    if (endTime && startTime >= endTime) {
      alert("Start time must be before end time.");
      return false;
    }
    
    if (checkConflict(startTime, endTime || Date.now(), id)) {
      alert("This time range conflicts with an existing entry.");
      return false;
    }

    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, startTime, endTime } : e)
    }));
    return true;
  };

  const toggleEntryBillable = (id: string) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, isBillable: !e.isBillable } : e)
    }));
  };

  const deleteEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id)
    }));
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const addProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: Project = {
      id: generateId(),
      name: newProjectName,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      hourlyRate: state.defaultHourlyRate,
      currency: state.preferredCurrency
    };
    setState(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
    setNewProjectName('');
  };

  const deleteProject = (projectId: string) => {
    if (confirm("Are you sure? This will permanently delete this project and ALL its associated time entries. This cannot be undone.")) {
      const entriesToRemove = state.entries.filter(e => e.projectId === projectId).map(e => e.id);
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        entries: prev.entries.filter(e => e.projectId !== projectId),
        activeEntry: prev.activeEntry?.projectId === projectId 
          ? { ...prev.activeEntry, projectId: undefined } 
          : prev.activeEntry
      }));
      const newSelected = new Set(selectedIds);
      entriesToRemove.forEach(id => newSelected.delete(id));
      setSelectedIds(newSelected);
    }
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, ...updates } : p)
    }));
  };

  const saveProjectChanges = () => {
    if (editingProjectId) {
      updateProject(editingProjectId, editProjectData);
      setEditingProjectId(null);
    }
  };

  const handleExport = async (ids?: Set<string>) => {
    let entriesToExport = state.entries;
    let reportName = 'All History';

    if (ids && ids.size > 0) {
      entriesToExport = state.entries.filter(e => ids.has(e.id));
      reportName = 'Selected Entries';
    } else if (exportFilter !== 'all') {
      entriesToExport = state.entries.filter(e => e.projectId === exportFilter);
      const project = state.projects.find(p => p.id === exportFilter);
      reportName = project ? `Project: ${project.name}` : 'Unknown Project';
    }

    if (entriesToExport.length === 0) return;
    
    setIsExporting(true);
    await exportToPdf(entriesToExport, state.projects, state.preferredCurrency, reportName);
    setIsExporting(false);
    setShowExportModal(false);
  };

  const saveSettings = () => {
    const newRate = parseFloat(settingsRate);
    if (isNaN(newRate) || newRate < 0) return;
    setState(prev => ({
      ...prev,
      defaultHourlyRate: newRate,
      preferredCurrency: settingsCurrency as 'USD' | 'IRT'
    }));
    setShowSettingsModal(false);
  };

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(state.themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setState(prev => ({ ...prev, themeMode: modes[nextIndex] }));
  };

  const resetData = () => {
    if (confirm("Reset all data? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const calculateTotalsByCurrency = (entryList: TimeEntry[]) => {
    return entryList.reduce((acc, curr) => {
      if (!curr.isBillable || !curr.endTime) return acc;
      const project = state.projects.find(p => p.id === curr.projectId);
      const currency = project?.currency || state.preferredCurrency;
      const amount = ((curr.endTime - curr.startTime) / 3600000) * curr.hourlyRate;
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const filteredEntries = useMemo(() => {
    return state.entries.filter(entry => {
      if (searchQuery && !entry.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (projectFilter !== 'all' && entry.projectId !== projectFilter) {
        return false;
      }
      if (startDateFilter) {
        const start = new Date(startDateFilter).setHours(0, 0, 0, 0);
        if (entry.startTime < start) return false;
      }
      if (endDateFilter) {
        const end = new Date(endDateFilter).setHours(23, 59, 59, 999);
        if (entry.startTime > end) return false;
      }
      return true;
    });
  }, [state.entries, searchQuery, projectFilter, startDateFilter, endDateFilter]);

  const totalBilledByCurrency = calculateTotalsByCurrency(state.entries);

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (ids: string[]) => {
    const allSelectedInGroup = ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelectedInGroup) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectedEntries = state.entries.filter(e => selectedIds.has(e.id));
  const selectedDuration = selectedEntries.reduce((acc, curr) => acc + ((curr.endTime || curr.startTime) - curr.startTime), 0);
  const selectedBilledByCurrency = calculateTotalsByCurrency(selectedEntries);

  const isAnyFilterActive = searchQuery !== '' || projectFilter !== 'all' || startDateFilter !== '' || endDateFilter !== '';

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 pb-20">
      
      {/* Background Animated Blobs - Visible only when timer is running */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${isTimerRunning ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 dark:bg-blue-900/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[40%] right-[-10%] w-[60%] h-[60%] bg-purple-400/10 dark:bg-indigo-900/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/5 dark:bg-slate-800/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Start Timer Flash Overlay */}
      <div key={`flash-${flashTrigger}`} className="fixed inset-0 pointer-events-none z-[100] bg-white dark:bg-blue-400 opacity-0 animate-flash" />

      <Header 
        totalBilledByCurrency={totalBilledByCurrency} 
        currency={state.preferredCurrency} 
        themeMode={state.themeMode}
        onToggleTheme={toggleTheme}
        onExport={() => setShowExportModal(true)} 
        onSettings={() => setShowSettingsModal(true)} 
      />

      {/* Sticky Tracker Bar Container */}
      <div className="sticky top-[57px] z-30 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-xl px-6 py-4 shadow-sm border-b border-gray-100/50 dark:border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <TrackerBar 
            activeEntry={state.activeEntry}
            elapsed={elapsed}
            projects={state.projects}
            onUpdateActive={(updates) => setState(prev => ({ ...prev, activeEntry: prev.activeEntry ? { ...prev.activeEntry, ...updates } : updates }))}
            onNewProject={() => setShowProjectModal(true)}
            onStart={startTimer}
            onStop={stopTimer}
            onAddManual={addManualEntry}
            checkConflict={checkConflict}
            descInputRef={descInputRef}
            projectSelectRef={projectSelectRef}
          />
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 relative z-10">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Time History</h2>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${showFilters || isAnyFilterActive ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400' : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            {isAnyFilterActive && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-1" />}
          </button>
        </div>

        {showFilters && (
          <div className="animate-modal">
            <FilterBar 
              projects={state.projects}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              projectFilter={projectFilter}
              setProjectFilter={setProjectFilter}
              startDate={startDateFilter}
              setStartDate={setStartDateFilter}
              endDate={endDateFilter}
              setEndDate={setEndDateFilter}
            />
          </div>
        )}

        <HistoryList 
          entries={filteredEntries}
          projects={state.projects}
          currency={state.preferredCurrency}
          selectedIds={selectedIds}
          onToggleSelectId={toggleSelectId}
          onToggleSelectGroup={toggleSelectGroup}
          onDelete={deleteEntry}
          onContinue={continueEntry}
          onUpdateDescription={updateEntryDescription}
          onUpdateEntryTime={updateEntryTime}
          onToggleBillable={toggleEntryBillable}
        />
      </main>

      <SelectionBar 
        selectedCount={selectedIds.size}
        totalDuration={selectedDuration}
        totalBilledByCurrency={selectedBilledByCurrency}
        onExport={() => handleExport(selectedIds)}
        onClear={() => setSelectedIds(new Set())}
      />

      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal border border-gray-100 dark:border-dark-border">
            <h2 className="text-xl font-bold mb-6 dark:text-white">Export Report</h2>
            <div className="space-y-6">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 border-gray-200 dark:border-dark-border transition-colors">
                  <input type="radio" name="exportFilter" value="all" checked={exportFilter === 'all'} onChange={(e) => setExportFilter(e.target.value)} />
                  <span className="text-sm font-semibold dark:text-gray-200">All Time Entries</span>
                </label>
                {state.projects.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 border-gray-200 dark:border-dark-border transition-colors">
                    <input type="radio" name="exportFilter" value={p.id} checked={exportFilter === p.id} onChange={(e) => setExportFilter(e.target.value)} />
                    <span className="text-sm font-semibold dark:text-gray-200">{p.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-50 dark:border-dark-border">
                <button 
                  disabled={isExporting}
                  onClick={() => handleExport()} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                >
                  {isExporting ? 'Generating PDF...' : 'Generate PDF Report'}
                </button>
                <button onClick={() => setShowExportModal(false)} className="w-full text-gray-500 py-3 font-bold hover:text-gray-800 dark:hover:text-gray-300 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal border border-gray-100 dark:border-dark-border">
            <h2 className="text-xl font-bold mb-6 dark:text-white">Application Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-2">Currency</label>
                <select className="w-full border border-gray-200 dark:border-dark-border rounded-xl px-4 py-3 bg-gray-50 dark:bg-black/20 dark:text-white focus:bg-white dark:focus:bg-black/40 transition-colors focus:outline-none" value={settingsCurrency} onChange={(e) => setSettingsCurrency(e.target.value as 'USD' | 'IRT')}>
                  <option value="USD">United States Dollar (USD)</option>
                  <option value="IRT">Iranian Toman (IRT)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-2">Default Hourly Rate</label>
                <input type="number" className="w-full border border-gray-200 dark:border-dark-border rounded-xl px-4 py-3 bg-gray-50 dark:bg-black/20 dark:text-white focus:bg-white dark:focus:bg-black/40 transition-colors focus:outline-none" value={settingsRate} onChange={(e) => setSettingsRate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-50 dark:border-dark-border">
                <button onClick={saveSettings} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95">Apply Preferences</button>
                <button onClick={resetData} className="w-full text-red-500 py-3 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">Wipe All Local Data</button>
                <button onClick={() => setShowSettingsModal(false)} className="w-full text-gray-400 font-bold py-2">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-modal border border-gray-100 dark:border-dark-border max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-6 dark:text-white">Project Manager</h2>
            
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-3 custom-scrollbar">
              {state.projects.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm font-medium italic border-2 border-dashed border-gray-100 dark:border-dark-border rounded-2xl">
                  No projects created yet.
                </div>
              ) : (
                state.projects.map(p => (
                  <div key={p.id} className="p-4 border border-gray-100 dark:border-dark-border rounded-2xl bg-gray-50/50 dark:bg-white/[0.03] transition-all hover:border-gray-200 dark:hover:border-gray-700">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      {editingProjectId === p.id ? (
                        <div className="flex-1 space-y-3">
                           <input 
                              autoFocus
                              className="w-full bg-white dark:bg-dark-muted border border-blue-500/50 rounded-lg px-3 py-1.5 text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10"
                              value={editProjectData.name || ''}
                              placeholder="Project Name"
                              onChange={(e) => setEditProjectData(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <div className="flex gap-2">
                               <div className="flex-1">
                                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-1">Rate</label>
                                  <input 
                                    type="number"
                                    className="w-full bg-white dark:bg-dark-muted border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold dark:text-white outline-none"
                                    value={editProjectData.hourlyRate || 0}
                                    onChange={(e) => setEditProjectData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                                  />
                               </div>
                               <div className="flex-1">
                                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-1">Currency</label>
                                  <select 
                                    className="w-full bg-white dark:bg-dark-muted border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold dark:text-white outline-none"
                                    value={editProjectData.currency || 'USD'}
                                    onChange={(e) => setEditProjectData(prev => ({ ...prev, currency: e.target.value as 'USD' | 'IRT' }))}
                                  >
                                    <option value="USD">USD</option>
                                    <option value="IRT">IRT</option>
                                  </select>
                               </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button onClick={saveProjectChanges} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">Save</button>
                              <button onClick={() => setEditingProjectId(null)} className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-500 text-xs font-bold py-2 rounded-lg">Cancel</button>
                            </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                           <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: p.color }} />
                           <div className="flex flex-col truncate">
                              <span className="font-bold text-gray-800 dark:text-[#fdfaf7] text-base truncate">{p.name}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {p.hourlyRate || state.defaultHourlyRate} {p.currency || state.preferredCurrency}/hr
                              </span>
                           </div>
                        </div>
                      )}
                      
                      {!editingProjectId && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => {
                              setEditingProjectId(p.id);
                              setEditProjectData({ ...p });
                            }}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Icons.Cog className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteProject(p.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Icons.Trash className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {!editingProjectId && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-dark-border/50">
                        {COLORS.map(c => (
                          <button 
                            key={c}
                            onClick={() => updateProject(p.id, { color: c })}
                            className={`w-6 h-6 rounded-full transition-all hover:scale-125 hover:shadow-md ${p.color === c ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-dark-surface scale-110 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-dark-border space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm font-medium bg-transparent dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600" 
                  placeholder="Enter project name..." 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addProject()} 
                />
                <button 
                  onClick={addProject} 
                  disabled={!newProjectName.trim()} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-500/20 text-sm whitespace-nowrap"
                >
                  Create
                </button>
              </div>
              <button onClick={() => setShowProjectModal(false)} className="w-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-bold py-3.5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Close Manager</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-16 border-t border-gray-100 dark:border-dark-border mt-20 relative z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="text-[11px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest mb-8">Keyboard Shortcuts</div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              ['S', 'Start/Stop'],
              ['D', 'Description'],
              ['B', 'Billable'],
              ['P', 'Project'],
              ['N', 'New Project'],
              ['E', 'Export'],
              ['F', 'Toggle Filters'],
              [',', 'Settings']
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 bg-white/50 dark:bg-dark-surface/50 border border-gray-100 dark:border-dark-border px-4 py-2 rounded-xl shadow-sm transition-transform hover:-translate-y-0.5">
                <kbd className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md min-w-[24px] text-xs">{key}</kbd>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-12 text-[10px] text-gray-300 dark:text-gray-700 font-medium tracking-[0.2em] uppercase">TEMPO &bull; NO TRACKING &bull; LOCAL ONLY</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
