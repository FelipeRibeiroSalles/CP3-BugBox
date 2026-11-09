import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
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
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showMessage } from "../dialog";
import { errorMessage, login, register, resetPassword } from "../services/auth";
import { colors } from "../theme";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "login" | "register";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  // Validação local antes de chamar o Firebase.
  function validate(): string | null {
    if (isRegister && name.trim().length < 2) {
      return "Informe seu nome (pelo menos 2 letras).";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Informe um e-mail válido.";
    }
    if (password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }
    if (isRegister && password !== confirmPassword) {
      return "As senhas digitadas não são iguais.";
    }
    return null;
  }

  async function handleSubmit() {
    if (loading) return;

    const problem = validate();
    if (problem) {
      showMessage("Confira os dados", problem);
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      // Sucesso: o onAuthStateChanged do App.tsx troca para a lista de bugs.
    } catch (error) {
      showMessage(
        isRegister ? "Não foi possível cadastrar" : "Não foi possível entrar",
        errorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!EMAIL_REGEX.test(email.trim())) {
      showMessage(
        "Recuperar senha",
        "Digite seu e-mail no campo acima e toque aqui de novo."
      );
      return;
    }

    try {
      await resetPassword(email);
      showMessage(
        "Recuperar senha",
        "Se existir uma conta com esse e-mail, você vai receber um link para criar uma nova senha."
      );
    } catch (error) {
      showMessage("Recuperar senha", errorMessage(error));
    }
  }

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setConfirmPassword("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Ionicons name="bug" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>BugBox</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? "Crie sua conta para registrar os bugs dos seus testes."
              : "Entre para ver os bugs que você registrou."}
          </Text>

          {isRegister && (
            <Field
              icon="person-outline"
              placeholder="Nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <Field
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Field
            icon="lock-closed-outline"
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            right={
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={10}
                accessibilityLabel={
                  showPassword ? "Esconder senha" : "Mostrar senha"
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            }
          />

          {isRegister && (
            <Field
              icon="lock-closed-outline"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          )}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? "Criar conta" : "Entrar"}
              </Text>
            )}
          </Pressable>

          {!isRegister && (
            <Pressable onPress={handleResetPassword} disabled={loading}>
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>
          )}

          <Pressable onPress={switchMode} disabled={loading}>
            <Text style={styles.switchText}>
              {isRegister ? "Já tem conta? " : "Ainda não tem conta? "}
              <Text style={styles.link}>
                {isRegister ? "Entrar" : "Cadastre-se"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
};

// Campo de texto reutilizável: ícone + TextInput + conteúdo opcional à direita.
function Field({ icon, right, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    padding: 24,
    gap: 14,
  },
  logo: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 10,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
  link: { color: colors.primary, fontWeight: "600", textAlign: "center" },
  switchText: { color: colors.muted, textAlign: "center", marginTop: 4 },
});
