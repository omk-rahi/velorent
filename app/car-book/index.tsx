import { Redirect, useLocalSearchParams } from "expo-router";

export default function CarBookIndex() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  return (
    <Redirect
      href={{ pathname: "/car-book/pickup", params: { carId } } as any}
    />
  );
}
