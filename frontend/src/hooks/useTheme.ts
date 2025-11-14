import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  // Detectar preferencia del sistema solo en la primera carga
  useEffect(() => {
    const storedData = localStorage.getItem('culturistas-theme');
    
    if (!storedData) {
      // Primera vez: detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, [setTheme]);

  // Aplicar o quitar clase 'dark' cada vez que cambie el tema
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return { theme, toggleTheme, setTheme };
}
