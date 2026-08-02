// src/components/app-tabs.tsx
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, TouchableOpacity, Linking, View, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DZ_PAYMENT_CONFIG } from '@/constants/algerian-education';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const pb = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 16);

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${DZ_PAYMENT_CONFIG.whatsapp}`).catch(() => {
      alert(`تعذّر فتح واتساب (${DZ_PAYMENT_CONFIG.whatsapp})`);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#059669',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#FAF8F5',
            position: 'absolute',
            bottom: pb + 10,
            left: 16,
            right: 16,
            borderRadius: 35,
            borderTopWidth: 1,
            borderColor: '#EAE2D6',
            height: 70,
            paddingBottom: 0,
            shadowColor: '#1F2937',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 8,
          },
          tabBarItemStyle: { paddingVertical: 8 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'دوراتي',
            tabBarIcon: () => <TabIcon emoji="📚" />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'الدليل',
            tabBarIcon: () => <TabIcon emoji="🔍" />,
          }}
        />
        <Tabs.Screen
          name="badges"
          options={{
            title: 'أوسمتي',
            tabBarIcon: () => <TabIcon emoji="🏅" />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'حسابي',
            tabBarIcon: () => <TabIcon emoji="👤" />,
          }}
        />
      </Tabs>

      {/* زر المساعدة السريع عبر واتساب */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openWhatsApp}
        accessibilityLabel="تواصل واتساب"
        style={{
          position: 'absolute',
          bottom: pb + 88,
          left: 20,
          backgroundColor: '#25D366',
          width: 52,
          height: 52,
          borderRadius: 26,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#25D366',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 10,
          zIndex: 999,
        } as any}
      >
        <Text style={{ fontSize: 26, color: '#FFFFFF' }}>💬</Text>
      </TouchableOpacity>
    </View>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}