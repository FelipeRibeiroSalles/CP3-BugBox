import { Alert, Platform } from "react-native";

// No navegador o Alert do React Native não aparece, então usamos
// window.alert / window.confirm. No celular, o Alert nativo.
const browser = globalThis as unknown as {
  alert: (text: string) => void;
  confirm: (text: string) => boolean;
};

export function showMessage(title: string, message: string) {
  if (Platform.OS === "web") {
    browser.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void
) {
  if (Platform.OS === "web") {
    if (browser.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: confirmText, style: "destructive", onPress: onConfirm },
  ]);
}
