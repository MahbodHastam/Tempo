export interface Project {
  id: string;
  name: string;
  color: string;
  clientName?: string;
  hourlyRate?: number;
  currency?: 'USD' | 'IRT';
}

export interface TimeEntry {
  id: string;
  description: string;
  projectId?: string;
  startTime: number; // timestamp
  endTime?: number; // timestamp, undefined if running
  isBillable: boolean;
  hourlyRate: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppState {
  entries: TimeEntry[];
  projects: Project[];
  activeEntry: Partial<TimeEntry> | null;
  defaultHourlyRate: number;
  preferredCurrency: 'USD' | 'IRT';
  themeMode: ThemeMode;
}