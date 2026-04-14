import { DigiLockerProvider } from "@cashfreepayments/react-native-digilocker";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import * as SplashScreen from "expo-splash-screen";

import "@/global.css";
import { supabase } from "@/lib/supabase";
import useUser from "@/store/use-user";

import { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        clearProfile();
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, phone, avatar_url, role_id, created_at",
          )
          .eq("id", currentSession.user.id)
          .single();

        if (error || !data) {
          throw error ?? new Error("Profile not found");
        }

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
        const dlVerified =
          hasText(customerData?.dl_number) &&
          hasText(customerData?.dl_name) &&
          hasText(customerData?.dl_address);

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
      } catch (err) {
        console.error("Profile fetch failed", err);
        clearProfile();
      }
    };

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);
        setAppReady(true);

        loadProfile(session);
      } catch (e) {
        console.error("Auth init failed", e);
        setAppReady(true);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        loadProfile(session);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearProfile, setProfile]);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  return (
    <QueryClientProvider client={client}>
      <DigiLockerProvider>
        <GluestackUIProvider mode={"light"}>
          <ThemeProvider value={DefaultTheme}>
            <Stack>
              <Stack.Protected guard={!Boolean(session)}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              </Stack.Protected>

              <Stack.Protected guard={Boolean(session)}>
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
            <StatusBar style="auto" />
          </ThemeProvider>
        </GluestackUIProvider>
      </DigiLockerProvider>
    </QueryClientProvider>
  );
}
