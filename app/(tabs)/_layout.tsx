import { Tabs } from 'expo-router';
import { Bookmark, House } from '@blinkdotnew/mobile-ui';

const TEAL = '#3a8378';
const PALE = '#e8f3ef';
const WHITE = '#F8F9FA';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: TEAL,
      tabBarInactiveTintColor: '#78918c',
      tabBarStyle: { backgroundColor: WHITE, borderTopColor: '#dce8e3', height: 66, paddingTop: 7, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      sceneStyle: { backgroundColor: PALE },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Главная', tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Моя библиотека', tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} /> }} />
    </Tabs>
  );
}
