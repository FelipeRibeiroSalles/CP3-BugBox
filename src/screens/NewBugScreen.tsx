import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useUser } from "../context/UserContext";
import { showMessage } from "../dialog";
import type { RootStackParamList } from "../navigation/types";
import { errorMessage } from "../services/auth";
import { addBug, type Severity } from "../services/bugs";
import { colors, severityInfo } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "NewBug">;

const TITLE_MAX = 80;
const DESCRIPTION_MAX = 500;
const SEVERITY_OPTIONS: Severity[] = ["baixa", "media", "alta", "critica"];

export default function NewBugScreen({ navigation }: Props) {
  const user = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("media");
  const [saving, setSaving] = useState(false);

  // O ref bloqueia um segundo toque antes mesmo da tela renderizar de novo.
  const savingRef = useRef(false);

  async function handleSave() {
    if (savingRef.current) return;

    if (title.trim().length < 3) {
      showMessage("Falta o título", "Descreva o bug em pelo menos 3 letras.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await addBug(user.uid, { title, description, severity });
      navigation.goBack();
    } catch (error) {
      showMessage("Não foi possível salvar", errorMessage(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: Botão Entrar não responde"
          placeholderTextColor={colors.muted}
          maxLength={TITLE_MAX}
        />
        <Text style={styles.counter}>
          {title.length}/{TITLE_MAX}
        </Text>

        <Text style={styles.label}>Como reproduzir</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Passos, resultado esperado e resultado obtido"
          placeholderTextColor={colors.muted}
          maxLength={DESCRIPTION_MAX}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.counter}>
          {description.length}/{DESCRIPTION_MAX}
        </Text>

        <Text style={styles.label}>Severidade</Text>
        <View style={styles.severities}>
          {SEVERITY_OPTIONS.map((option) => {
            const info = severityInfo[option];
            const selected = option === severity;
            return (
              <Pressable
                key={option}
                style={[
                  styles.severity,
                  { borderColor: info.color },
                  selected && { backgroundColor: info.color },
                ]}
                onPress={() => setSeverity(option)}
              >
                <Text
                  style={[
                    styles.severityText,
                    { color: selected ? colors.background : info.color },
                  ]}
                >
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>Salvar bug</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 20,
    gap: 8,
  },
  label: { color: colors.text, fontSize: 15, fontWeight: "600", marginTop: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: { minHeight: 120 },
  counter: { color: colors.muted, fontSize: 12, textAlign: "right" },
  severities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  severity: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  severityText: { fontWeight: "700" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
