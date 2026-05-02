import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertCircleIcon,
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileCheck,
  User,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { verifyBankAccount } from "@/api/verification";

import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";

import {
  getCustomerBankData,
  upsertBeneficiary,
  upsertCustomerBankData,
} from "@/api/profile";
import { Loader } from "@/components/shared/loader";
import { TableDetail } from "@/components/shared/table-detail";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input, InputField } from "@/components/ui/input";
import { Colors } from "@/constants/theme";
import useUser from "@/store/use-user";
import { router } from "expo-router";

const ACCOUNT_REGEX = /^\d{9,18}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function BankAccountVerificationScreen() {
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountNumberError, setAccountNumberError] = useState<string | null>(
    null,
  );
  const [ifscError, setIfscError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const user = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ["bank-detail"],
    queryFn: () => getCustomerBankData(user?.profile?.id!),
    enabled: !!user?.profile?.id,
  });

  useEffect(() => {
    if (data) {
      setAccountNumber(data.bank_account_number ?? "");
      setIfsc(data.ifsc_code ?? "");
      setIsVerified(false);
    }
  }, [data]);

  const {
    mutate,
    data: bankData,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: verifyBankAccount,
    onSuccess: () => setIsVerified(true),
  });

  const { mutate: registerBeneficiary, isPending: isRegisteringBeneficiary } =
    useMutation({
      mutationFn: upsertBeneficiary,
      onSuccess: () => router.back(),
      onError: (err) => {
        console.warn("[beneficiary] registration failed:", err);
        router.back();
      },
    });

  // Step 1: persist bank details to Supabase
  const { mutate: saveData, isPending: isSavingData } = useMutation({
    mutationFn: upsertCustomerBankData,
    onSuccess: () => {
      // Chain: create/update Cashfree beneficiary
      registerBeneficiary({
        customerId: user.profile!.id,
        accountHolderName: bankData?.nameAtBank ?? "",
        accountNumber,
        ifsc,
        email: user.profile?.email ?? undefined,
      });
    },
  });

  if (isLoading) return <Loader />;

  const handleSubmit = () => {
    const isAccountNumberValid = ACCOUNT_REGEX.test(accountNumber);
    const isIfscValid = IFSC_REGEX.test(ifsc);

    setAccountNumberError(
      isAccountNumberValid ? null : "Enter a valid account number",
    );
    setIfscError(isIfscValid ? null : "Enter a valid IFSC code");

    if (!isAccountNumberValid || !isIfscValid) return;

    mutate({ accountNumber, ifsc, userId: user.profile?.id ?? "" });
  };

  const handleReset = () => {
    setAccountNumber(data?.bank_account_number ?? "");
    setIfsc(data?.ifsc_code ?? "");
    setAccountNumberError(null);
    setIfscError(null);
    setIsVerified(false);
    setIsEditMode(false);
    reset();
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setIsVerified(false);
  };

  const handleConfirm = () => {
    if (user.profile?.id) {
      saveData({
        customerId: user.profile.id,
        bankAccountHolder: bankData?.nameAtBank,
        bankAccountNumber: accountNumber,
        ifscCode: ifsc,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
        >
          <VStack className="gap-6 mt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <VStack space="xs">
              <Heading
                size="2xl"
                style={{ fontWeight: "800", letterSpacing: -0.5 }}
              >
                Bank account details
              </Heading>
              <Text className="text-typography-500" style={{ fontSize: 15 }}>
                Enter your bank account details
              </Text>
            </VStack>
          </VStack>

          <FormControl
            isInvalid={!!accountNumberError}
            size="md"
            className="mt-8"
          >
            <FormControlLabel style={{ marginBottom: 6 }}>
              <FormControlLabelText
                style={{
                  color: "#64748B",
                  fontWeight: "600",
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}
              >
                ACCOUNT NUMBER
              </FormControlLabelText>
            </FormControlLabel>

            <Input
              size="xl"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: accountNumberError
                  ? Colors.light.error
                  : "#E2E8F0",
                height: 56,
              }}
            >
              <InputField
                placeholder="Enter account number"
                keyboardType="number-pad"
                editable={!data?.bank_account_number || isEditMode}
                value={accountNumber}
                onChangeText={(text) => {
                  setAccountNumber(text.replace(/\s/g, ""));
                  setAccountNumberError(null);
                }}
                style={{ fontSize: 16, color: "#0F172A" }}
              />
            </Input>

            {accountNumberError && (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText>
                  {accountNumberError}
                </FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <FormControl isInvalid={!!ifscError} size="md" className="mt-4">
            <FormControlLabel style={{ marginBottom: 6 }}>
              <FormControlLabelText
                style={{
                  color: "#64748B",
                  fontWeight: "600",
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}
              >
                IFSC CODE
              </FormControlLabelText>
            </FormControlLabel>

            <Input
              size="xl"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: ifscError ? Colors.light.error : "#E2E8F0",
                height: 56,
              }}
            >
              <InputField
                placeholder="e.g. SBIN0000123"
                autoCapitalize="characters"
                editable={!data?.ifsc_code || isEditMode}
                value={ifsc}
                onChangeText={(text) => {
                  setIfsc(text.toUpperCase().replace(/\s/g, ""));
                  setIfscError(null);
                }}
                style={{ fontSize: 16, color: "#0F172A" }}
              />
            </Input>

            {ifscError && (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText>{ifscError}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {isError && (
            <Alert className="mt-4 rounded-xl bg-error-50" action="error">
              <AlertIcon as={AlertCircle} />
              <AlertText>{error.message}</AlertText>
            </Alert>
          )}

          {bankData && isVerified && (
            <VStack className="mt-8" space="sm">
              <Heading
                size="sm"
                style={{ color: "#64748B", letterSpacing: 0.5 }}
              >
                VERIFICATION MATCH
              </Heading>
              <Card
                className="p-4"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <VStack className="divide-y divide-outline-100">
                  <TableDetail
                    icon={User}
                    label="Name"
                    value={bankData.nameAtBank}
                  />
                  <TableDetail
                    icon={Building2}
                    label="Bank"
                    value={bankData.bankName}
                  />
                  <TableDetail
                    icon={FileCheck}
                    label="Branch"
                    value={bankData.branch}
                  />
                  <TableDetail
                    icon={CheckCircle2}
                    label="Status"
                    value={bankData.accountStatus}
                  />
                </VStack>
              </Card>
            </VStack>
          )}
        </ScrollView>

        <VStack space="md" className="px-5 pb-6 pt-3 bg-transparent">
          {(!data?.bank_account_number || isEditMode) ? (
            <>
              {!isVerified ? (
                <Button
                  size="xl"
                  onPress={handleSubmit}
                  disabled={isPending}
                  style={{ borderRadius: 16 }}
                >
                  {isPending && <ButtonSpinner color="#fff" />}
                  <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                    Verify
                  </ButtonText>
                </Button>
              ) : (
                <Button
                  size="xl"
                  action="positive"
                  onPress={handleConfirm}
                  disabled={isSavingData || isRegisteringBeneficiary}
                  style={{ borderRadius: 16, backgroundColor: Colors.light.tint }}
                >
                  {(isSavingData || isRegisteringBeneficiary) && (
                    <ButtonSpinner color="#fff" />
                  )}
                  <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                    Update
                  </ButtonText>
                </Button>
              )}
              {isEditMode && (
                <Button
                  size="xl"
                  action="negative"
                  onPress={handleReset}
                  style={{ borderRadius: 16 }}
                >
                  <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                    Cancel
                  </ButtonText>
                </Button>
              )}
            </>
          ) : (
            <Button
              size="xl"
              action="negative"
              onPress={handleEdit}
              style={{ borderRadius: 16 }}
            >
              <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                Edit Details
              </ButtonText>
            </Button>
          )}
        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
