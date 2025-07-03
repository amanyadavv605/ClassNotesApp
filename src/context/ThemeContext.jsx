// src/context/ThemeContext.js
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
