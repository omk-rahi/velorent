import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Colors } from "@/constants/theme";

/**
 * OAuth deep-link landing screen: velorentnative://auth-callback
 *
 * Calling maybeCompleteAuthSession() here signals expo-web-browser that the
 * OAuth session is complete, which resolves the openAuthSessionAsync() promise
 * back in signInWithOAuth(). Token exchange is intentionally handled only
 * there, so the same redirect is not processed twice.
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F7F8FC",
      }}
    >
      <ActivityIndicator size="large" color={Colors.light.tint} />
    </View>
  );
}
