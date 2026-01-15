import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/hooks/use-app-theme';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 추가
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

const STORAGE_KEY = 'VOCA_CARD_STATES_V1'; // 퀴즈 화면과 동일한 키 사용

const THEME = {
    dark: {
        background: '#141414',
        surface: '#1f1f1f',
        onSurface: '#fefbff',
        onSurfaceVariant: '#e6e1e3',
        primary: '#9f86ff',
        danger: '#ff8686',
    },
    light: {
        background: '#fefbff',
        surface: '#f2ecee',
        onSurface: '#1f1f1f',
        onSurfaceVariant: '#1c1b1d',
        primary: '#6442d6',
        danger: '#d64242',
    }
};

export default function SettingsScreen() {
    const { theme, setTheme } = useAppTheme();
    const isDarkMode = theme === 'dark';
    const colors = isDarkMode ? THEME.dark : THEME.light;

    // 초기화 핵심 로직
    const handleResetProgress = () => {
        const resetAction = async () => {
            try {
                // 1. 로컬 저장소 데이터 삭제
                await AsyncStorage.removeItem(STORAGE_KEY);

                // 2. 성공 알림
                if (Platform.OS === 'web') {
                    alert("학습 기록이 초기화되었습니다. 앱을 다시 시작하거나 퀴즈 화면으로 이동하면 반영됩니다.");
                } else {
                    Alert.alert("완료", "모든 학습 기록이 초기화되었습니다.");
                }

                // 참고: 만약 전역 상태(Context/Redux)를 사용 중이라면 여기서 해당 상태도 초기화해야 합니다.
            } catch (e) {
                console.error("Failed to reset progress", e);
                alert("초기화 중 오류가 발생했습니다.");
            }
        };

        // 초기화 확인 컨펌창
        if (Platform.OS === 'web') {
            if (confirm("모든 단어의 암기 상태와 학습 진도가 삭제됩니다. 정말 초기화하시겠습니까?")) {
                resetAction();
            }
        } else {
            Alert.alert(
                "학습 기록 초기화",
                "모든 단어의 암기 상태와 진도가 삭제되며 되돌릴 수 없습니다.",
                [
                    { text: "취on", style: "cancel" },
                    { text: "초기화", onPress: resetAction, style: "destructive" }
                ]
            );
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>설정</Text>
                </View>

                {/* 프로필 섹션 */}
                <View style={styles.section}>
                    <View style={styles.profileRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>G</Text>
                        </View>
                        <View>
                            <Text style={[styles.userName, { color: colors.onSurface }]}>Guest User</Text>
                            <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>로그인이 필요합니다</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.background }]} />

                {/* 테마 설정 섹션 */}
                <View style={styles.section}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabelGroup}>
                            <IconSymbol name="moon.fill" size={20} color={colors.onSurface} />
                            <Text style={[styles.settingText, { color: colors.onSurface }]}>다크 모드</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.background }]} />

                {/* 데이터 관리 섹션 */}
                <View style={styles.section}>
                    <Pressable
                        style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
                        onPress={handleResetProgress}
                    >
                        <View style={styles.settingLabelGroup}>
                            <IconSymbol name="trash.fill" size={20} color={colors.danger} />
                            <Text style={[styles.settingText, { color: colors.danger }]}>학습 기록 초기화</Text>
                        </View>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: colors.onSurfaceVariant }]}>Version 1.0.0</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { alignItems: 'center', justifyContent: 'center', padding: 20, flexGrow: 1 },
    card: { width: '100%', maxWidth: 480, borderRadius: 32, padding: 24, paddingBottom: 32 },
    header: { marginBottom: 12 },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    section: { borderRadius: 12, paddingHorizontal: 0, marginBottom: 8 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
    settingLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingText: { fontSize: 16, fontWeight: '500' },
    divider: { height: 1, width: '100%' },
    profileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    userName: { fontSize: 18, fontWeight: '700' },
    userEmail: { fontSize: 14, marginTop: 2 },
    footer: { alignItems: 'center', marginTop: 10 },
    versionText: { fontSize: 12, opacity: 0.5 }
});