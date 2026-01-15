import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const bg = Colors[colorScheme ?? 'light'].background;
  const tint = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,

        // 탭 아이템을 수직/수평 중앙 정렬
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },

        tabBarStyle: {
          backgroundColor: bg,
          height: 52,         // 슬림한 높이
          paddingBottom: 0,   // 수직 중앙 배치를 위해 하단 패딩 제거
          borderTopWidth: 0,  // 상단 실선 제거
          elevation: 0,       // 안드로이드 그림자 제거
        },

        // 중간 구분선을 포함하던 배경 설정을 삭제하거나 빈 뷰로 대체
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: bg }} />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <IconSymbol size={28} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <IconSymbol size={26} name="gearshape.fill" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    // 안드로이드 잘림 방지를 위해 충분한 영역 확보 및 중앙 정렬
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});