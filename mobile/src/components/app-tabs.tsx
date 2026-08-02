import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  
  const pb = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 16);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16A34A', // Primary Green for cohesive LMS feel
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          position: 'absolute',
          bottom: pb + 10,
          left: 20,
          right: 20,
          borderRadius: 35,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 0,
          shadowColor: '#16A34A',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mes Cours',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="📚" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Catalogue',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🔍" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="👤" />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple emoji icon component (no native symbols needed = Expo Go compatible)
function TabIcon({ emoji }: { emoji: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}
