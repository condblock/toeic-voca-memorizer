import { useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { AppThemeContext } from './use-app-theme';

/**
 * Web 전용 훅: 먼저 전역 AppThemeContext를 확인하고, 없으면 클라이언트에서 시스템 색상으로 폴백합니다.
 */
export function useColorScheme() {
  const ctx = useContext(AppThemeContext);
  if (ctx) return ctx.theme;

  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}