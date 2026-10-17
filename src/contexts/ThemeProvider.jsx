import { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext';

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('vibely_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('vibely_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const value = {
    isDark,
    toggleTheme: () => setIsDark((current) => !current),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
