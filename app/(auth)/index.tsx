import { Link } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const SLIDES = [
  {
    title: "Find the perfect car near you",
    subtitle: "Choose from cars available right around you.",
    lottie: require("@/assets/animations/car-search.json"),
  },
  {
    title: "Verified cars you can trust",
    subtitle: "Every car is inspected and ready to go.",
    lottie: require("@/assets/animations/verified-cars.json"),
  },
  {
    title: "24x7 Support",
    subtitle: "Day or night, we're always with you.",
    lottie: require("@/assets/animations/support.json"),
  },
];

export default function CustomerIntroScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[index];

  return (
    <SafeAreaView className="flex-1 bg-white px-5">
      <View className="flex-1 justify-center">
        <VStack space="2xl" className="items-center">
          <Animated.View
            key={slide.title}
            entering={FadeIn}
            exiting={FadeOut}
            className="items-center"
          >
            <LottieView
              source={slide.lottie}
              autoPlay
              loop={false}
              style={{ width: 260, height: 260 }}
            />
          </Animated.View>

          <VStack space="xs" className="items-center px-4">
            <Heading size="3xl" className="text-center">
              {slide.title}
            </Heading>
            <Text className="text-center text-typography-500 text-base">
              {slide.subtitle}
            </Text>
          </VStack>

          <HStack space="sm">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${
                  i === index ? "w-6 bg-primary-500" : "w-2 bg-primary-200"
                }`}
              />
            ))}
          </HStack>
        </VStack>
      </View>

      <View className="pb-8">
        <VStack space="sm">
          <Link href="/(auth)/register" asChild>
            <Button size="xl">
              <ButtonText>Start your journey</ButtonText>
            </Button>
          </Link>

          <Link href="/(auth)/login" asChild>
            <Button size="lg" variant="link">
              <ButtonText>I already have an account</ButtonText>
            </Button>
          </Link>
        </VStack>
      </View>
    </SafeAreaView>
  );
}
