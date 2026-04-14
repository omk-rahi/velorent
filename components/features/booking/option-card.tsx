import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";

interface OptionCardProps {
  selected: boolean;
  onPress: () => void;
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OptionCard({
  selected,
  onPress,
  icon,
  title,
  subtitle,
  badge,
}: OptionCardProps) {
  const pressed = useSharedValue(0);
  const progress = useDerivedValue(() =>
    withSpring(selected ? 1 : 0, { damping: 18, stiffness: 200 }),
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value ? 0.985 : 1 }],
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.light.cardBorder, Colors.light.tint],
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.light.card, Colors.light.tint + "08"],
    ),
  }));

  const iconBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.light.background, Colors.light.tint + "18"],
    ),
  }));

  const radioOuterStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.light.cardBorder, Colors.light.tint],
    ),
  }));

  const radioDotStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(selected ? 1 : 0, { damping: 14, stiffness: 260 }) },
    ],
    opacity: selected ? 1 : 0,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      style={[styles.pressable, cardStyle]}
    >
      {/* Icon */}
      <Animated.View style={[styles.iconContainer, iconBgStyle]}>
        <Ionicons
          name={icon as any}
          size={21}
          color={selected ? Colors.light.tint : Colors.light.icon}
        />
      </Animated.View>

      <View style={styles.textContent}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: selected ? Colors.light.tint : Colors.light.text },
            ]}
          >
            {title}
          </Text>
          {badge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: selected
                    ? Colors.light.tint + "18"
                    : Colors.light.background,
                  borderColor: selected
                    ? Colors.light.tint + "40"
                    : Colors.light.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: selected
                      ? Colors.light.tint
                      : Colors.light.iconMuted,
                  },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Animated.View style={[styles.radioOuter, radioOuterStyle]}>
        <Animated.View
          style={[
            styles.radioDot,
            { backgroundColor: Colors.light.tint },
            radioDotStyle,
          ]}
        />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
