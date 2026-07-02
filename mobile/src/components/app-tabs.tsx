import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      activeTintColor="#16A34A"
      inactiveTintColor="#6B7280"
      indicatorColor="#DCFCE7"
      labelStyle={{ 
        selected: { color: '#16A34A', fontWeight: 'bold' },
        unselected: { color: '#6B7280' }
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          symbol="house.fill"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Catalogue</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          symbol="book.fill"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          symbol="person.fill"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
