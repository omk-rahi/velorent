import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { FlatList, Pressable, useWindowDimensions, View } from "react-native";

import type { Coupon } from "@/api/coupons";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";

const ADS = [
  {
    id: "nearby",
    title: "Cars near your pickup",
    subtitle: "Find verified rides around your area",
    cta: "Explore nearby",
    image: require("@/assets/images/car-1.png"),
    backgroundColor: "#EAF1FF",
    accentColor: Colors.light.tint,
    route: "/all-cars",
    params: {},
  },
  {
    id: "delivery",
    title: "Doorstep delivery",
    subtitle: "Choose cars that can come to you",
    cta: "See options",
    image: require("@/assets/images/demo.png"),
    backgroundColor: "#ECFDF5",
    accentColor: Colors.light.success,
    route: "/all-cars",
    params: { q: "delivery" },
  },
  {
    id: "weekend",
    title: "Weekend-ready rides",
    subtitle: "Comfortable cars for short getaways",
    cta: "Book now",
    image: require("@/assets/images/car-1.png"),
    backgroundColor: "#FFF7E6",
    accentColor: Colors.light.warning,
    route: "/all-cars",
    params: {},
  },
];
const AUTO_SLIDE_INTERVAL_MS = 4000;
const DEFAULT_OFFER_PALETTE = {
  backgroundColor: "#EAF1FF",
  accentColor: Colors.light.tint,
};
const OFFER_PALETTES = [
  DEFAULT_OFFER_PALETTE,
  { backgroundColor: "#ECFDF5", accentColor: Colors.light.success },
  { backgroundColor: "#FFF7E6", accentColor: Colors.light.warning },
  { backgroundColor: "#F5F3FF", accentColor: "#7C3AED" },
  { backgroundColor: "#FFF1F2", accentColor: "#E11D48" },
];

function getOfferDiscountLabel(offer: Coupon) {
  return offer.discount_type === "percentage"
    ? `${offer.discount_value}% off`
    : `Rs.${offer.discount_value} off`;
}

function getOfferPalette(offer: Coupon, index: number) {
  const codeTotal = offer.code
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return OFFER_PALETTES[(codeTotal + index) % OFFER_PALETTES.length];
}

export const adjustHslLightness = (hsl: string, amount: number): string => {
  const match = hsl.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);

  if (!match) return hsl;

  const [, h, s, l] = match;
  const newLightness = Math.max(0, Math.min(100, Number(l) + amount));

  return `hsl(${h}, ${s}%, ${newLightness}%)`;
};

export function HomeAdsCarousel({ offers = [] }: { offers?: Coupon[] }) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);
  const cardWidth = Math.min(width - 40, 360);
  const slideWidth = cardWidth + 14;

  const carouselItems = useMemo(
    () =>
      offers.length > 0
        ? offers.map((offer, index) => {
            const palette = getOfferPalette(offer, index);

            return {
              id: offer.id,
              title: offer.title,
              subtitle: offer.description || getOfferDiscountLabel(offer),
              cta: `#${offer.code}`,
              image: offer.image_url
                ? { uri: offer.image_url }
                : require("@/assets/images/car-1.png"),
              backgroundColor: offer.bg_color ?? palette.backgroundColor,
              accentColor: offer.accent_color ?? palette.accentColor,
              route: "/all-cars",
              params: {},
            };
          })
        : ADS,
    [offers],
  );

  useEffect(() => {
    activeIndexRef.current = 0;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [carouselItems.length]);

  useEffect(() => {
    if (carouselItems.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % carouselItems.length;
      activeIndexRef.current = nextIndex;
      listRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [carouselItems.length]);

  return (
    <VStack>
      <FlatList
        ref={listRef}
        data={carouselItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          activeIndexRef.current = Math.round(
            event.nativeEvent.contentOffset.x / slideWidth,
          );
        }}
        onScrollToIndexFailed={({ index }) => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({
              offset: slideWidth * index,
              animated: true,
            });
          });
        }}
        contentContainerStyle={{ gap: 14, paddingHorizontal: 2 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: item.route as any, params: item.params })
            }
            style={{
              width: cardWidth,
              minHeight: 156,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: item.backgroundColor,
              borderWidth: 1,
              borderColor: Colors.light.cardBorder,
            }}
          >
            <HStack style={{ flex: 1, alignItems: "center" }}>
              <VStack
                style={{
                  flex: 1,
                  gap: 8,
                  paddingLeft: 18,
                  paddingVertical: 18,
                  paddingRight: 6,
                }}
              >
                <View
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 999,
                    backgroundColor: adjustHslLightness(
                      item.backgroundColor,
                      -10,
                    ),
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      color: item.accentColor,
                      fontSize: 10,
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    Offer
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    color: Colors.light.text,
                    fontSize: 20,
                    fontWeight: "900",
                    lineHeight: 26,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    color: Colors.light.icon,
                    fontSize: 12,
                    fontWeight: "600",
                    lineHeight: 17,
                  }}
                >
                  {item.subtitle}
                </Text>
                <Text
                  style={{
                    color: item.accentColor,
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  {item.cta}
                </Text>
              </VStack>

              <Image
                source={item.image}
                contentFit="contain"
                style={{
                  width: 138,
                  height: 118,
                  marginRight: -8,
                }}
              />
            </HStack>
          </Pressable>
        )}
      />
    </VStack>
  );
}
