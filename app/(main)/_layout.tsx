import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { CalendarCheck, Home, User } from "lucide-react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type TabIconProps = {
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  color: string;
  focused: boolean;
};

function TabIcon({ Icon, color, focused }: TabIconProps) {
  return (
    <View
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={21} color={color} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(15, 23, 42, 0.06)",
          height: Platform.OS === "ios" ? 78 : 68,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.3,
          marginBottom: Platform.OS === "ios" ? 0 : 6,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          popToTopOnBlur: true,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={CalendarCheck} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          popToTopOnBlur: true,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
