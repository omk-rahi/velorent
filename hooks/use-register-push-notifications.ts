import { useEffect } from "react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerPushToken(userId: string) {
  if (!Device.isDevice) return;

  const hasAndroidFirebaseConfig =
    Platform.OS !== "android" ||
    Boolean(Constants.expoConfig?.android?.googleServicesFile);

  if (!hasAndroidFirebaseConfig) {
    console.warn(
      "Skipping Android push registration: add google-services.json and expo.android.googleServicesFile to app.json.",
    );
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let status = existingPermission.status;

  if (status !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    status = requestedPermission.status;
  }

  if (status !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const { data } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  await supabase
    .from("profiles")
    .update({ expo_push_token: data })
    .eq("id", userId);
}

export function useRegisterPushNotifications(session: Session | null) {
  useEffect(() => {
    if (!session?.user?.id) return;

    registerPushToken(session.user.id).catch((error) => {
      console.warn("Push notification registration skipped or failed", error);
    });
  }, [session?.user?.id]);
}
