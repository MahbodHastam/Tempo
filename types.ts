
export interface Project {
  id: string;
  name: string;
  color: string;
  clientName?: string;
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

export interface AppState {
  entries: TimeEntry[];
  projects: Project[];
  activeEntry: Partial<TimeEntry> | null;
  defaultHourlyRate: number;
  preferredCurrency: 'USD' | 'IRT';
}
