import { getCarBrands } from "@/api/brands";
import { getCars } from "@/api/cars";
import { BrandsScrollList } from "@/components/features/brands/brands-scroll-list";
import { MostPopularCars, TopCars } from "@/components/features/cars/car-list";
import { Header } from "@/components/shared/header";
import { Loader } from "@/components/shared/loader";
import { VStack } from "@/components/ui/vstack";
import { useQuery } from "@tanstack/react-query";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { data: carBrands, isLoading } = useQuery({
    queryKey: ["car-brands"],
    queryFn: getCarBrands,
  });

  const { data: cars, isLoading: isCarLoading } = useQuery({
    queryKey: ["popular-cars"],
    queryFn: () => getCars(),
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F7F8FC" }}
      edges={["top"]}
    >
      <VStack style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <Header />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, marginTop: 20 }}
        >
          <VStack space="xl" style={{ paddingBottom: 32 }}>
            {isLoading || isCarLoading ? (
              <Loader />
            ) : (
              <>
                <BrandsScrollList brands={carBrands} />
                <TopCars cars={cars} />
                <MostPopularCars cars={cars} />
              </>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
