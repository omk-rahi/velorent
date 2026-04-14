import { Image, View } from "react-native";

export function Loader() {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
      <Image
        source={require("@/assets/images/loading.gif")}
        alt="Loader"
        style={{ width: 240, height: 240 }}
      />
    </View>
  );
}
