import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../../src/theme/colors';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📋" label="Records" />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📊" label="Reports" />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💳" label="Payments" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    minWidth: 60,
  },
  tabIconActive: {
    backgroundColor: Colors.accentDark + '33',
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
