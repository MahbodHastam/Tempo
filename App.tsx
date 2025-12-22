import React, { useState, useEffect, useRef } from 'react';
import { TimeEntry, Project, AppState, ThemeMode } from './types';
import { COLORS, Icons } from './constants';
import { formatDuration, generateId } from './utils';
import { exportToPdf } from './services/exportService';
import { Header } from './components/Header';
import { TrackerBar } from './components/TrackerBar';
import { HistoryList } from './components/HistoryList';

const STORAGE_KEY = 'tempo_app_state_v2';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.preferredCurrency) parsed.preferredCurrency = 'USD';
        if (!parsed.themeMode) parsed.themeMode = 'system';
        // Handle potential migration if projects were previously defined with default data
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
  const [exportFilter, setExportFilter] = useState('all');
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const descInputRef = useRef<HTMLInputElement>(null);
  const projectSelectRef = useRef<HTMLSelectElement>(null);

  const [settingsRate, setSettingsRate] = useState(state.defaultHourlyRate.toString());
  const [settingsCurrency, setSettingsCurrency] = useState(state.preferredCurrency);

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

  useEffect(() => {
    if (showSettingsModal) {
      setSettingsRate(state.defaultHourlyRate.toString());
      setSettingsCurrency(state.preferredCurrency);
    }
  }, [showSettingsModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');

      if (e.key === 'Escape') {
        setShowProjectModal(false);
        setShowExportModal(false);
        setShowSettingsModal(false);
        setEditingProjectId(null);
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
    const entry: Partial<TimeEntry> = {
      id: generateId(),
      description: state.activeEntry?.description || '',
      startTime: Date.now(),
      isBillable: state.activeEntry?.isBillable ?? true,
      hourlyRate: state.defaultHourlyRate,
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

  const deleteEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id)
    }));
  };

  const addProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: Project = {
      id: generateId(),
      name: newProjectName,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      clientName: 'Client'
    };
    setState(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
    setNewProjectName('');
  };

  const deleteProject = (projectId: string) => {
    if (confirm("Are you sure? This will permanently delete this project and ALL its associated time entries. This cannot be undone.")) {
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        entries: prev.entries.filter(e => e.projectId !== projectId),
        activeEntry: prev.activeEntry?.projectId === projectId 
          ? { ...prev.activeEntry, projectId: undefined } 
          : prev.activeEntry
      }));
    }
  };

  const updateProject = (projectId: string, name: string) => {
    if (!name.trim()) return;
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, name } : p)
    }));
    setEditingProjectId(null);
  };

  const changeProjectColor = (projectId: string, color: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, color } : p)
    }));
  };

  const handleExport = () => {
    let entriesToExport = state.entries;
    let reportName = 'All History';
    if (exportFilter !== 'all') {
      entriesToExport = state.entries.filter(e => e.projectId === exportFilter);
      const project = state.projects.find(p => p.id === exportFilter);
      reportName = project ? `Project: ${project.name}` : 'Unknown Project';
    }
    if (entriesToExport.length === 0) return;
    exportToPdf(entriesToExport, state.projects, state.preferredCurrency, reportName);
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

  const totalBilled = state.entries.reduce((acc, curr) => 
    curr.isBillable && curr.endTime ? acc + ((curr.endTime - curr.startTime) / 3600000) * curr.hourlyRate : acc, 0
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
      <Header 
        totalBilled={totalBilled} 
        currency={state.preferredCurrency} 
        themeMode={state.themeMode}
        onToggleTheme={toggleTheme}
        onExport={() => setShowExportModal(true)} 
        onSettings={() => setShowSettingsModal(true)} 
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <TrackerBar 
          activeEntry={state.activeEntry}
          elapsed={elapsed}
          projects={state.projects}
          onUpdateActive={(updates) => setState(prev => ({ ...prev, activeEntry: prev.activeEntry ? { ...prev.activeEntry, ...updates } : updates }))}
          onNewProject={() => setShowProjectModal(true)}
          onStart={startTimer}
          onStop={stopTimer}
          descInputRef={descInputRef}
          projectSelectRef={projectSelectRef}
        />

        <HistoryList 
          entries={state.entries}
          projects={state.projects}
          currency={state.preferredCurrency}
          onDelete={deleteEntry}
          onContinue={continueEntry}
          onUpdateDescription={updateEntryDescription}
        />
      </main>

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
                <button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95">Generate PDF Report</button>
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
                        <input 
                          autoFocus
                          className="flex-1 bg-white dark:bg-dark-muted border border-blue-500/50 rounded-lg px-3 py-1.5 text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateProject(p.id, editName);
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                          onBlur={() => updateProject(p.id, editName)}
                        />
                      ) : (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                           <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: p.color }} />
                           <span className="font-bold text-gray-800 dark:text-[#fdfaf7] text-base truncate">{p.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => {
                            setEditingProjectId(p.id);
                            setEditName(p.name);
                          }}
                          className={`p-2 transition-colors rounded-lg ${editingProjectId === p.id ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
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
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-dark-border/50">
                      {COLORS.map(c => (
                        <button 
                          key={c}
                          onClick={() => changeProjectColor(p.id, c)}
                          className={`w-6 h-6 rounded-full transition-all hover:scale-125 hover:shadow-md ${p.color === c ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-dark-surface scale-110 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
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

      <footer className="py-16 border-t border-gray-100 dark:border-dark-border mt-20">
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
              [',', 'Settings']
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border px-4 py-2 rounded-xl shadow-sm transition-transform hover:-translate-y-0.5">
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