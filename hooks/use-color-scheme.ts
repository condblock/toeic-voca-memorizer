import { useContext } from 'react';
import { AppThemeContext } from './use-app-theme';

// 기존에 `export { useColorScheme } from 'react-native';` 였던 파일을 대체합니다.
// 전역 테마 컨텍스트가 있으면 그 값을 반환하고, 없으면 'light'를 기본으로 반환합니다.

export function useColorScheme(): 'light' | 'dark' {
    const ctx = useContext(AppThemeContext);
    if (ctx) return ctx.theme;
    return 'light';
}