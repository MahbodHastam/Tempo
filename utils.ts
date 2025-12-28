
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

export const formatCurrency = (amount: number, currency: 'USD' | 'IRT' = 'USD'): string => {
  if (currency === 'IRT') {
    // Formatting for Iranian Toman (localized)
    const formattedNumber = new Intl.NumberFormat('fa-IR', {
      useGrouping: true,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
    
    // Using actual Persian script for the currency label
    return `${formattedNumber} تومان`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const groupEntriesByDate = <T extends { startTime: number }>(entries: T[]) => {
  return entries.reduce((groups, entry) => {
    const date = new Date(entry.startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, T[]>);
};
