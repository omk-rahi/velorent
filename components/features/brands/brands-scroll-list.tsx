import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

export function BrandsScrollList({ brands }) {
  return (
    <VStack style={{ gap: 14 }}>
      <HStack
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 2,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: Colors.light.text,
            letterSpacing: -0.3,
          }}
        >
          Top Brands
        </Text>

        <Link href="/all-brands" asChild>
          <Button variant="link" size="sm">
            <ButtonText
              style={{
                color: Colors.light.tint,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              View All
            </ButtonText>
          </Button>
        </Link>
      </HStack>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 2, gap: 16 }}
      >
        {brands.slice(0, 6).map((brand) => (
          <Pressable
            key={brand.id}
            onPress={() =>
              router.push({
                pathname: "/all-cars",
                params: { brandId: brand.id, brandName: brand.name },
              })
            }
          >
            <VStack style={{ alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 100,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.light.card,
                  borderWidth: 1.5,
                  borderColor: "transparent",
                  shadowColor: "#1A56FF",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <Image
                  source={{ uri: brand.logo_url }}
                  contentFit="contain"
                  style={{ width: 42, height: 42 }}
                />
              </View>

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: Colors.light.icon,
                  letterSpacing: 0.1,
                }}
              >
                {brand.name}
              </Text>
            </VStack>
          </Pressable>
        ))}
      </ScrollView>
    </VStack>
  );
}
