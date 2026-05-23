/**
 * Drop-in replacement for @cashfreepayments/react-native-digilocker that applies
 * bottom safe-area insets on Android edge-to-edge so DigiLocker's Allow button
 * is not covered by the system navigation bar.
 */
import React, { createContext, useContext, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

/** 3-button nav on Android edge-to-edge often reports bottom inset as 0. */
const ANDROID_BUTTON_NAV_INSET = 48;

function getWebViewBottomInset(bottom: number) {
  if (Platform.OS !== "android") return bottom;
  return bottom === 0 ? ANDROID_BUTTON_NAV_INSET : bottom;
}

const PROD_LISTENER_URL = "https://verification.cashfree.com/dgl/status";
const SBOX_LISTENER_URL = "https://verification-test.cashfree.com/dgl/status";

export interface DigiLockerConfig {
  url: string;
  redirectUrl?: string;
  userFlow?: "signin" | "signup";
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface DigiLockerResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface DigiLockerModalProps {
  config: DigiLockerConfig;
  visible: boolean;
  onResult: (result: DigiLockerResult) => void;
  onCancel: () => void;
}

interface DigiLockerContextType {
  showModal: (config: DigiLockerConfig) => void;
  hideModal: () => void;
}

const DigiLockerContext = createContext<DigiLockerContextType | null>(null);

function getListenerUrlFromUrl(url: string) {
  if (url.includes("verification-test.cashfree.com")) return SBOX_LISTENER_URL;
  return PROD_LISTENER_URL;
}

export function DigiLockerProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<DigiLockerConfig | null>(null);

  const showModal = (modalConfig: DigiLockerConfig) => {
    setConfig(modalConfig);
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
  };

  const handleResult = (result: DigiLockerResult) => {
    setIsVisible(false);

    if (result.success) {
      config?.onSuccess?.(result.data);
    } else {
      config?.onError?.(result.error || "Unknown error");
    }
  };

  const handleCancel = () => {
    setIsVisible(false);
    config?.onCancel?.();
  };

  return (
    <DigiLockerContext.Provider value={{ showModal, hideModal }}>
      {children}
      {config && (
        <DigiLockerModalComponent
          key={`${config.url}-${Date.now()}`}
          config={config}
          visible={isVisible}
          onResult={handleResult}
          onCancel={handleCancel}
        />
      )}
    </DigiLockerContext.Provider>
  );
}

export function useDigiLocker() {
  const context = useContext(DigiLockerContext);

  const verify = (
    url: string,
    redirectUrl?: string,
    options?: Partial<DigiLockerConfig>,
  ) => {
    const listenerUrl = getListenerUrlFromUrl(url);
    const fullConfig: DigiLockerConfig = {
      url,
      redirectUrl: redirectUrl || listenerUrl,
      ...options,
    };

    if (context) {
      context.showModal(fullConfig);
    } else {
      console.warn(
        "DigiLockerProvider not found. Wrap your app with DigiLockerProvider.",
      );
    }
  };

  return { verify };
}

function DigiLockerModalComponent({
  config,
  visible,
  onResult,
  onCancel,
}: DigiLockerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const webViewBottomInset = getWebViewBottomInset(insets.bottom);
  const signInflow = config.userFlow === "signin";

  const getDigiLockerScript = () => `
      if (window.location.href.includes('digilocker.meripehchaan.gov.in')) {
        function execute() {
            document.getElementById('otherbtn').click()
            document.getElementById('dropdownmenu').value='Aadhar'
            document.getElementById('terms3').checked = true
            document.getElementById('submitbtn3').disabled = false
        }
        execute();
      }
      true;
    `;

  const defaultRedirectUrl = PROD_LISTENER_URL;

  const onNavigationStateChange = (navState: { url: string }) => {
    if (navState.url.includes(config.redirectUrl || defaultRedirectUrl)) {
      setTimeout(() => {
        onResult({
          success: true,
          data: { redirectUrl: navState.url },
        });
      }, 1000);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      presentationStyle="fullScreen"
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="white"
        translucent={false}
      />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        <View
          style={[
            styles.webViewContainer,
            webViewBottomInset > 0
              ? { paddingBottom: webViewBottomInset }
              : null,
          ]}
        >
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#0000ff" />
              <Text>Loading...</Text>
            </View>
          )}

          <WebView
            source={{ uri: config.url }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            onNavigationStateChange={onNavigationStateChange}
            injectedJavaScript={signInflow ? getDigiLockerScript() : undefined}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    minHeight: 56,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
    flexDirection: "row",
  },
  backArrow: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
    textAlignVertical: "center",
    lineHeight: 20,
    includeFontPadding: false,
  },
  backButtonText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
    textAlignVertical: "center",
    lineHeight: 20,
    includeFontPadding: false,
    paddingLeft: 4,
    marginTop: 5,
  },
  headerSpacer: {
    width: 60,
    minHeight: 40,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    flexDirection: "row",
  },
});
