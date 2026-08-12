import { DigiLockerProvider } from "@/components/providers/digilocker-provider";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import * as SplashScreen from "expo-splash-screen";

import "@/global.css";
import { supabase } from "@/lib/supabase";
import useUser from "@/store/use-user";

import { Colors } from "@/constants/theme";
import { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(main)",
};

const client = new QueryClient();
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const setProfile = useUser((state) => state.setProfile);
  const clearProfile = useUser((state) => state.clearProfile);
  const [appReady, setAppReady] = useState(false);
  // Tracks whether the profile load attempt has completed (success or failure)
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        clearProfile();
        if (isMounted) setProfileReady(true);
        return;
      }

      try {
        // Use maybeSingle() — new social-login users may not have a profile row yet
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, phone, avatar_url, role_id, created_at",
          )
          .eq("id", currentSession.user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          // New social sign-in: profile row may not exist yet.
          // Set a stub from JWT metadata so routing can proceed immediately.
          // The enter-phone screen will collect the phone, and the profile
          // will be fully created there.
          const meta = currentSession.user.user_metadata || {};
          if (isMounted) {
            setProfile({
              id: currentSession.user.id,
              full_name: meta.full_name || meta.name || "",
              email: currentSession.user.email || "",
              phone: null, // No phone yet → routes to enter-phone
              avatar_url: meta.avatar_url || meta.picture || null,
              aadhaar_verified: false,
              dl_verified: false,
            });
          }
        } else {
          const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select(
              "aadhaar_number,aadhaar_name,aadhaar_address,dl_number,dl_name,dl_address",
            )
            .eq("id", currentSession.user.id)
            .maybeSingle();

          if (customerError) {
            console.error("Customer verification fetch failed", customerError);
          }

          const hasText = (value: unknown) =>
            typeof value === "string" && value.trim().length > 0;

          const aadhaarVerified =
            hasText(customerData?.aadhaar_number) &&
            hasText(customerData?.aadhaar_name) &&
            hasText(customerData?.aadhaar_address);
          const dlVerified = hasText(customerData?.dl_number);

          if (isMounted) {
            setProfile({
              id: data.id,
              full_name: data.full_name,
              email: data.email,
              phone: data.phone,
              avatar_url: data.avatar_url,
              aadhaar_verified: aadhaarVerified,
              dl_verified: dlVerified,
            });
          }
        }
      } catch (err) {
        console.error("Profile fetch failed", err);
        clearProfile();
      } finally {
        if (isMounted) setProfileReady(true);
      }
    };

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);
        await loadProfile(session);
      } catch (e) {
        console.error("Auth init failed", e);
        clearProfile();
        if (isMounted) setProfileReady(true);
      } finally {
        if (isMounted) {
          setAppReady(true);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Hide screens behind the overlay while profile is re-fetched
        setProfileReady(false);
        loadProfile(session);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearProfile, setProfile]);

  const profile = useUser((state) => state.profile);
  const hasPhone = profile ? Boolean(profile.phone) : false;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Only block rendering during cold start — never block on subsequent auth changes
  if (!appReady) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <DigiLockerProvider>
        <GluestackUIProvider mode={"light"}>
          <ThemeProvider value={DefaultTheme}>
            <Stack>
              <Stack.Protected guard={!Boolean(session)}>
                {/* (auth) is first so logout defaults here, not auth-callback.
                    auth-callback stays in this guard so maybeCompleteAuthSession()
                    is called correctly after OAuth redirect. */}
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
              </Stack.Protected>

              <Stack.Protected guard={Boolean(session) && !hasPhone}>
                <Stack.Screen name="enter-phone" options={{ headerShown: false }} />
              </Stack.Protected>

              <Stack.Protected guard={Boolean(session) && hasPhone}>
                <Stack.Screen name="(main)" options={{ headerShown: false }} />

                <Stack.Screen
                  name="all-brands"
                  options={{
                    title: "All Brands",
                    headerTitleAlign: "center",
                  }}
                />
                <Stack.Screen
                  name="all-cars"
                  options={{
                    title: "All Cars",
                    headerTitleAlign: "center",
                  }}
                />
                <Stack.Screen
                  name="car-result"
                  options={{
                    title: "Car Results",
                  }}
                />
                <Stack.Screen
                  name="car-detail"
                  options={{
                    title: "Car Details",
                  }}
                />
                <Stack.Screen
                  name="all-review"
                  options={{
                    title: "Reviews",
                    headerTitleAlign: "center",
                  }}
                />

                <Stack.Screen
                  name="car-book"
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="verify-aadhaar"
                  options={{
                    title: "Aadhaar Verification",
                    headerTitleAlign: "center",
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="verify-driving-license"
                  options={{
                    title: "Driving License",
                    headerTitleAlign: "center",
                    headerShown: false,
                  }}
                />
              </Stack.Protected>
            </Stack>

            {/* Loading overlay — shown whenever the profile is being determined
                (login, logout, or cold start with session). Covers whatever the
                Stack is showing so no intermediate screen (e.g. enter-phone) is
                ever visible to the user before we know the correct destination. */}
            {!profileReady && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
              </View>
            )}

            <StatusBar style="auto" />
          </ThemeProvider>
        </GluestackUIProvider>
      </DigiLockerProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F7F8FC",
    alignItems: "center",
    justifyContent: "center",
  },
});
