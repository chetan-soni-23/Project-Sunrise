import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme-dark');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (dark) {
      root.classList.add('dark');
      body.style.backgroundColor = '#020617';
      body.style.color = '#e2e8f0';
      root.style.backgroundColor = '#020617';
    } else {
      root.classList.remove('dark');
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#1e293b';
      root.style.backgroundColor = '#f8fafc';
    }
    localStorage.setItem('theme-dark', dark);
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
