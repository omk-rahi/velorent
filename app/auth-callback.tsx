import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Colors } from "@/constants/theme";
import { completeOAuthSignIn, extractOAuthParamsFromUrl } from "@/api/auth";

/**
 * OAuth deep-link landing screen: velorentnative://auth-callback
 *
 * Calling maybeCompleteAuthSession() here signals expo-web-browser that the
 * OAuth session is complete, which resolves the openAuthSessionAsync() promise
 * back in handleSocialLogin(). The rest (setSession, loadProfile, navigation)
 * is handled by _layout.tsx + Stack.Protected guards automatically.
 */
export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    let isMounted = true;

    const completeFromDeepLink = async () => {
      const url = await Linking.getInitialURL();

      if (!url) return;

      const { access_token, refresh_token, error, error_description } =
        extractOAuthParamsFromUrl(url);

      if (error) {
        throw new Error(error_description || error);
      }

      if (!access_token || !refresh_token) return;

      await completeOAuthSignIn(url);
    };

    completeFromDeepLink().catch((err: any) => {
      console.error("OAuth callback failed:", err);
      if (isMounted) {
        setError(err.message || "Social sign-in failed. Please try again.");
      }
    });

    return () => {
      isMounted = false;
    };
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
      {error ? (
        <Text
          style={{
            color: Colors.light.error,
            marginTop: 16,
            paddingHorizontal: 24,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
