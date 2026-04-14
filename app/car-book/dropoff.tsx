import { Redirect, useLocalSearchParams } from "expo-router";

export default function DropoffStep() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  return <Redirect href={{ pathname: "/car-book/datetime", params: { carId } }} />;
}
