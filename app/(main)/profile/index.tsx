import { logout } from "@/api/auth";
import { ProfileActionItem } from "@/components/features/profile/profile-action-item";
import { ProfileHeader } from "@/components/features/profile/profile-header";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import useUser from "@/store/use-user";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  User,
} from "lucide-react-native";
import { Linking, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const profile = useUser((state) => state.profile);
  const clearProfile = useUser((state) => state.clearProfile);

  const { mutate: handleLogout } = useMutation({
    mutationFn: logout,
    onSuccess() {
      clearProfile();
    },
  });

  const aadhaarVerified = profile?.aadhaar_verified === true;
  const dlVerified = profile?.dl_verified === true;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="xl" className="p-5 pb-10">
          <ProfileHeader
            name={profile?.full_name ?? ""}
            email={profile?.email ?? ""}
            profile={profile?.avatar_url ?? ""}
          />

          <VStack space="md">
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Colors.light.iconMuted,
                letterSpacing: 0.5,
                marginLeft: 4,
                marginBottom: -4,
              }}
            >
              VERIFICATION
            </Text>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                overflow: "hidden",
              }}
            >
              {/* Aadhaar row */}
              <TouchableOpacity
                activeOpacity={aadhaarVerified ? 1 : 0.7}
                onPress={aadhaarVerified ? undefined : () => router.push("/verify-aadhaar")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.light.cardBorder,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.light.text }}>Aadhaar</Text>
                  <Text style={{ fontSize: 12, color: Colors.light.iconMuted, marginTop: 1 }}>
                    {aadhaarVerified ? "Verified" : "Tap to verify"}
                  </Text>
                </View>
                {aadhaarVerified ? (
                  <CheckCircle2 size={20} color="#10B981" />
                ) : (
                  <ChevronRight size={18} color={Colors.light.iconMuted} />
                )}
              </TouchableOpacity>

              {/* Driving License row */}
              <TouchableOpacity
                activeOpacity={dlVerified ? 1 : 0.7}
                onPress={dlVerified ? undefined : () => router.push("/verify-driving-license")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CreditCard size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.light.text }}>Driving License</Text>
                  <Text style={{ fontSize: 12, color: Colors.light.iconMuted, marginTop: 1 }}>
                    {dlVerified ? "Verified" : "Tap to verify"}
                  </Text>
                </View>
                {dlVerified ? (
                  <CheckCircle2 size={20} color="#10B981" />
                ) : (
                  <ChevronRight size={18} color={Colors.light.iconMuted} />
                )}
              </TouchableOpacity>
            </View>
          </VStack>

          <VStack space="md" style={{ marginTop: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Colors.light.iconMuted,
                letterSpacing: 0.5,
                marginLeft: 4,
                marginBottom: -4,
              }}
            >
              ACCOUNT
            </Text>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                overflow: "hidden",
              }}
            >
              <ProfileActionItem
                icon={User}
                title="Edit Profile"
                subtitle="Manage personal details"
                onPress={() => router.push("/profile/edit-profile")}
                iconColor="#8B5CF6"
                iconBg="rgba(139, 92, 246, 0.12)"
              />

              <ProfileActionItem
                icon={Camera}
                title="Add Selfie"
                subtitle="Update your profile photo"
                onPress={() => router.push("/profile/add-profile")}
                iconColor="#F59E0B"
                iconBg="rgba(245, 158, 11, 0.12)"
                isLast
              />
            </View>
          </VStack>

          <VStack space="md" style={{ marginTop: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Colors.light.iconMuted,
                letterSpacing: 0.5,
                marginLeft: 4,
                marginBottom: -4,
              }}
            >
              LEGAL & SUPPORT
            </Text>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                overflow: "hidden",
              }}
            >
              <ProfileActionItem
                icon={FileText}
                title="Terms & Conditions"
                onPress={() => Linking.openURL("https://www.velorent.in/terms")}
                iconColor="#64748B"
                iconBg="rgba(107, 161, 236, 0.12)"
              />

              <ProfileActionItem
                icon={HelpCircle}
                title="Help & Support"
                onPress={() => Linking.openURL("https://www.velorent.in/support")}
                iconColor={Colors.light.tint}
                iconBg="rgba(26, 86, 255, 0.12)"
                isLast
              />
            </View>
          </VStack>

          <View style={{ marginTop: 16 }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                overflow: "hidden",
              }}
            >
              <ProfileActionItem
                icon={LogOut}
                title="Log out"
                onPress={() => handleLogout()}
                isDestructive
                isLast
              />
            </View>
          </View>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
