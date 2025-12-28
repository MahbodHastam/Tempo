import React, { useState } from 'react';
import { Project } from '../types';

interface FilterBarProps {
  projects: Project[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  projectFilter: string;
  setProjectFilter: (id: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  projects,
  searchQuery,
  setSearchQuery,
  projectFilter,
  setProjectFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}) => {
  const [showDates, setShowDates] = useState(false);

  const hasActiveFilters = searchQuery || projectFilter !== 'all' || startDate || endDate;

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilter('all');
    setStartDate('');
    setEndDate('');
    setShowDates(false);
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search entries..."
            className="w-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Project Filter */}
        <div className="relative flex-shrink-0">
          <select 
            className="appearance-none bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer min-w-[140px]"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Date Range Button */}
        <button 
          onClick={() => setShowDates(!showDates)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${showDates || startDate || endDate ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400' : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>Date Range</span>
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest hover:text-red-500 transition-colors px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Date Range Inputs */}
      {showDates && (
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-black/10 p-4 rounded-2xl animate-modal border border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">From</label>
            <input 
              type="date" 
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">To</label>
            <input 
              type="date" 
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
             <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 ml-auto"
             >
               Reset Range
             </button>
          )}
        </div>
      )}
    </div>
  );
};