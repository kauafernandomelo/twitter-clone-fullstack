export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme';

/** Preferência salva neste navegador (padrão: seguir o sistema). */
export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    // modo privado / storage bloqueado: segue o sistema
    return 'system';
  }
}

/** Aplica no <html> (o CSS faz o resto) e lembra a escolha. */
export function setThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;

  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // sem storage a escolha vale só até recarregar
  }
}
