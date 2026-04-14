import { HStack } from "@/components/ui/hstack";
import { PressableCard } from "@/components/ui/pressable-card";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ZapIcon } from "lucide-react-native";
import { RefObject, useEffect, useRef, useState } from "react";
import { Image as RNImage, useWindowDimensions, View } from "react-native";
import PagerView from "react-native-pager-view";

type Variant = "horizontal" | "vertical";

type Props = {
  variant?: Variant;
  car: any;
  isVisible?: boolean;
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1619767886558-efdc259cde1a";
const AUTO_SLIDE_INTERVAL_MS = 4500;
const REQUIRED_VISIBILITY_RATIO = 0.98;

function CardImageSlider({
  images,
  height,
  shouldAutoPlay = true,
  visibilityTargetRef,
}: {
  images: string[];
  height: number;
  shouldAutoPlay?: boolean;
  visibilityTargetRef?: RefObject<View | null>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const containerRef = useRef<View>(null);
  const currentIndexRef = useRef(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const displayImages = images.length > 0 ? images : [PLACEHOLDER];

  useEffect(() => {
    currentIndexRef.current = 0;
    setActiveIndex(0);
    pagerRef.current?.setPageWithoutAnimation(0);
  }, [displayImages.length]);

  useEffect(() => {
    if (displayImages.length <= 1 || !shouldAutoPlay) return;

    const timer = setInterval(() => {
      const targetRef = visibilityTargetRef?.current
        ? visibilityTargetRef
        : containerRef;

      targetRef.current?.measureInWindow((x, y, width, measuredHeight) => {
        if (width <= 0 || measuredHeight <= 0) return;

        const visibleWidth = Math.min(x + width, windowWidth) - Math.max(x, 0);
        const visibleHeight =
          Math.min(y + measuredHeight, windowHeight) - Math.max(y, 0);

        if (visibleWidth <= 0 || visibleHeight <= 0) return;

        const visibleArea = visibleWidth * visibleHeight;
        const totalArea = width * measuredHeight;
        const visibilityRatio = totalArea > 0 ? visibleArea / totalArea : 0;

        if (visibilityRatio < REQUIRED_VISIBILITY_RATIO) return;

        const nextIndex = (currentIndexRef.current + 1) % displayImages.length;
        pagerRef.current?.setPage(nextIndex);
      });
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [
    displayImages.length,
    shouldAutoPlay,
    visibilityTargetRef,
    windowHeight,
    windowWidth,
  ]);

  if (displayImages.length === 1) {
    return (
      <RNImage
        source={{ uri: displayImages[0] }}
        resizeMode="cover"
        style={{ width: "100%", height }}
      />
    );
  }

  return (
    <View
      ref={containerRef}
      style={{ width: "100%", height, overflow: "hidden" }}
    >
      <PagerView
        ref={pagerRef}
        style={{ width: "100%", height: "100%" }}
        initialPage={0}
        onPageSelected={(event) => {
          const idx = event.nativeEvent.position;
          currentIndexRef.current = idx;
          setActiveIndex(idx);
        }}
      >
        {displayImages.map((item, index) => (
          <View key={`car-image-${index}`} style={{ flex: 1 }}>
            <RNImage
              source={{ uri: item }}
              resizeMode="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        ))}
      </PagerView>

      <View
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "center",
          gap: 5,
        }}
      >
        {displayImages.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === activeIndex ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i === activeIndex ? Colors.light.tint : "rgba(255,255,255,0.7)",
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function CarCard({
  variant = "horizontal",
  car,
  isVisible = true,
}: Props) {
  const cardRef = useRef<View>(null);

  if (!car) return null;

  const isHorizontal = variant === "horizontal";
  const imageHeight = isHorizontal ? 160 : 175;
  const rating = Number(car.average_rating || 0).toFixed(1);
  const reviews = car.review_count || 0;

  const images: string[] =
    Array.isArray(car.car_images) && car.car_images.length > 0
      ? car.car_images.map((img: any) => img.image_url).filter(Boolean)
      : car.image_url
        ? [car.image_url]
        : [];

  return (
    <PressableCard
      onPress={() =>
        router.push({
          pathname: "/car-detail",
          params: { id: car.id },
        })
      }
    >
      <View
        ref={cardRef}
        style={{
          width: isHorizontal ? 290 : "100%",
          backgroundColor: Colors.light.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: "transparent",
          shadowColor: "#1A56FF",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 8,
          elevation: 1,
          overflow: "hidden",
        }}
      >
        <View style={{ position: "relative" }}>
          <CardImageSlider
            images={images}
            height={imageHeight}
            shouldAutoPlay={isVisible}
            visibilityTargetRef={cardRef}
          />

          {car.delivery_enabled && (
            <HStack
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.94)",
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
              }}
            >
              <ZapIcon size={10} color={Colors.light.success} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: Colors.light.text,
                }}
              >
                Delivery
              </Text>
            </HStack>
          )}
        </View>

        <VStack
          style={{
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 14,
            gap: 0,
          }}
        >
          <HStack
            style={{
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <VStack style={{ flex: 1, marginRight: 8, gap: 2 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: Colors.light.text,
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
              >
                {car.car_brands?.name} {car.car_models?.name}
              </Text>
              <HStack style={{ alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={11} color="#F5A524" />
                <Text
                  style={{ fontSize: 11, fontWeight: "600", color: "#F5A524" }}
                >
                  {reviews > 0 ? rating : "New"}
                </Text>
                {reviews > 0 && (
                  <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>
                    · {reviews} reviews
                  </Text>
                )}
              </HStack>
            </VStack>

            <VStack style={{ alignItems: "flex-end", gap: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: Colors.light.tint,
                  letterSpacing: -0.3,
                }}
              >
                ₹{car.hourly_price}
              </Text>
              <Text style={{ fontSize: 10, color: Colors.light.iconMuted }}>
                / hour
              </Text>
            </VStack>
          </HStack>

          {!isHorizontal && (
            <HStack style={{ marginTop: 10, gap: 6 }}>
              <SpecChip
                icon="people-outline"
                value={`${car.vehicle_seat_capacity ?? "-"} Seats`}
              />
              <SpecChip
                icon="flash-outline"
                value={car.fuel_type?.toUpperCase() ?? "-"}
              />
              <SpecChip
                icon="calendar-outline"
                value={String(car.manufacturing_year || "-")}
              />
            </HStack>
          )}
        </VStack>
      </View>
    </PressableCard>
  );
}

function SpecChip({
  icon,
  value,
}: {
  icon: any;
  value: string;
}) {
  return (
    <HStack
      style={{
        alignItems: "center",
        gap: 5,
        backgroundColor: Colors.light.tint + "12",
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
      }}
    >
      <Ionicons name={icon} size={12} color={Colors.light.tint} />
      <Text
        style={{ fontSize: 11, fontWeight: "600", color: Colors.light.text }}
      >
        {value}
      </Text>
    </HStack>
  );
}
