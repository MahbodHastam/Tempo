
import React, { useState, useEffect, useRef } from 'react';
import { TimeEntry, Project, AppState } from './types';
import { COLORS } from './constants';
import { formatDuration, generateId } from './utils';
import { getSmartSuggestions } from './services/geminiService';
import { exportToPdf } from './services/exportService';
import { Header } from './components/Header';
import { TrackerBar } from './components/TrackerBar';
import { HistoryList } from './components/HistoryList';
import { Icons } from './constants';

const STORAGE_KEY = 'tempo_app_state_v2';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.preferredCurrency) parsed.preferredCurrency = 'USD';
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      entries: [],
      projects: [
        { id: '1', name: 'Internal', color: COLORS[0], clientName: 'Self' },
        { id: '2', name: 'Design System', color: COLORS[4], clientName: 'Acme Corp' }
      ],
      activeEntry: null,
      defaultHourlyRate: 50,
      preferredCurrency: 'USD'
    };
  });

  const [elapsed, setElapsed] = useState(0);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [exportFilter, setExportFilter] = useState('all');
  const [newProjectName, setNewProjectName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const descInputRef = useRef<HTMLInputElement>(null);
  const projectSelectRef = useRef<HTMLSelectElement>(null);

  const [settingsRate, setSettingsRate] = useState(state.defaultHourlyRate.toString());
  const [settingsCurrency, setSettingsCurrency] = useState(state.preferredCurrency);

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
        const select = projectSelectRef.current;
        if (select) {
          select.focus();
          if ('showPicker' in HTMLSelectElement.prototype) {
            try {
              (select as any).showPicker();
            } catch (err) {
              console.warn("showPicker not supported or blocked", err);
            }
          }
        }
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
          activeEntry: { 
            ...prev.activeEntry, 
            isBillable: prev.activeEntry ? !prev.activeEntry.isBillable : true 
          }
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
      ...state.activeEntry as TimeEntry,
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
    setShowProjectModal(false);
  };

  const handleAiImprove = async () => {
    if (!state.activeEntry?.description) return;
    setAiLoading(true);
    const suggestion = await getSmartSuggestions(state.activeEntry.description);
    if (suggestion) {
      setState(prev => ({
        ...prev,
        activeEntry: {
          ...prev.activeEntry,
          description: suggestion.professionalDescription
        }
      }));
    }
    setAiLoading(false);
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

  const resetData = () => {
    if (confirm("Reset all data?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const totalBilled = state.entries.reduce((acc, curr) => 
    curr.isBillable && curr.endTime ? acc + ((curr.endTime - curr.startTime) / 3600000) * curr.hourlyRate : acc, 0
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        totalBilled={totalBilled} 
        currency={state.preferredCurrency} 
        onExport={() => setShowExportModal(true)} 
        onSettings={() => setShowSettingsModal(true)} 
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <TrackerBar 
          activeEntry={state.activeEntry}
          elapsed={elapsed}
          projects={state.projects}
          aiLoading={aiLoading}
          onUpdateActive={(updates) => setState(prev => ({ ...prev, activeEntry: { ...prev.activeEntry, ...updates } }))}
          onAiImprove={handleAiImprove}
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal">
            <h2 className="text-xl font-bold mb-6">Export Report</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 border-gray-200">
                  <input type="radio" name="exportFilter" value="all" checked={exportFilter === 'all'} onChange={(e) => setExportFilter(e.target.value)} />
                  <span className="text-sm font-medium">All History</span>
                </label>
                {state.projects.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 border-gray-200">
                    <input type="radio" name="exportFilter" value={p.id} checked={exportFilter === p.id} onChange={(e) => setExportFilter(e.target.value)} />
                    <span className="text-sm font-medium">{p.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200">Generate PDF</button>
                <button onClick={() => setShowExportModal(false)} className="w-full text-gray-500 py-3 font-bold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal">
            <h2 className="text-xl font-bold mb-6">Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
                <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5" value={settingsCurrency} onChange={(e) => setSettingsCurrency(e.target.value as 'USD' | 'IRT')}>
                  <option value="USD">Dollar (USD)</option>
                  <option value="IRT">Iranian Toman (IRT)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hourly Rate</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-4 py-2.5" value={settingsRate} onChange={(e) => setSettingsRate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={saveSettings} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Save Changes</button>
                <button onClick={resetData} className="w-full text-red-500 py-3 font-bold">Reset All Data</button>
                <button onClick={() => setShowSettingsModal(false)} className="w-full text-gray-500 font-bold">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal">
            <h2 className="text-xl font-bold mb-6">New Project</h2>
            <div className="space-y-4">
              <input type="text" autoFocus className="w-full border border-gray-200 rounded-lg px-4 py-2.5" placeholder="Project Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addProject()} />
              <button onClick={addProject} disabled={!newProjectName.trim()} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg disabled:opacity-50">Create Project</button>
              <button onClick={() => setShowProjectModal(false)} className="w-full text-gray-500 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 border-t border-gray-100 mt-20">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-gray-400 font-medium flex flex-col items-center gap-2">
          <div>Tempo Time Tracker &bull; Privacy First</div>
          <div className="flex gap-3 mt-1">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">S - Start/Stop</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">D - Focus Description</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">B - Toggle Billable</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">P - Project</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">N - New Project</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">E - Export</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">, - Settings</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
