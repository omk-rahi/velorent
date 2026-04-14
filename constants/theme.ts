/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0F172A",
    background: "#F7F8FC",
    tint: "#1A56FF",
    accent: "#4F46E5",
    icon: "#64748B",
    iconMuted: "#94A3B8",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#1A56FF",
    card: "#FFFFFF",
    cardBorder: "#E8ECF4",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    gradientStart: "#1A56FF",
    gradientEnd: "#4F46E5",
  },
  dark: {
    text: "#F1F5F9",
    background: "#0F172A",
    tint: "#4D7EFF",
    accent: "#6366F1",
    icon: "#94A3B8",
    iconMuted: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: "#4D7EFF",
    card: "#1E293B",
    cardBorder: "#334155",
    error: "#F87171",
    success: "#34D399",
    warning: "#FBBF24",
    gradientStart: "#4D7EFF",
    gradientEnd: "#6366F1",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
