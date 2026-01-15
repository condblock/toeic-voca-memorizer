import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type AppTheme = 'light' | 'dark';
type AppThemeContextType = {
    theme: AppTheme;
    setTheme: (t: AppTheme) => void;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const system = useRNColorScheme();
    const initial = system === 'dark' ? 'dark' : 'light';
    const [theme, setTheme] = useState<AppTheme>(initial);

    const value = useMemo(() => ({ theme, setTheme }), [theme]);

    return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
    const ctx = useContext(AppThemeContext);
    if (!ctx) {
        throw new Error('useAppTheme must be used within AppThemeProvider');
    }
    return ctx;
}

export { AppThemeContext };
