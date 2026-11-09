import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { UserContext } from "./src/context/UserContext";
import { auth } from "./src/firebase";
import type { RootStackParamList } from "./src/navigation/types";
import BugListScreen from "./src/screens/BugListScreen";
import LoginScreen from "./src/screens/LoginScreen";
import NewBugScreen from "./src/screens/NewBugScreen";
import { colors } from "./src/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Escuta a sessão: recebe o usuário ao entrar e null ao sair.
  // O retorno do onAuthStateChanged cancela a escuta (limpeza do efeito).
  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingSession(false);
    });
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <UserContext.Provider value={user}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            {user ? (
              <>
                <Stack.Screen
                  name="Bugs"
                  component={BugListScreen}
                  options={{ title: "BugBox" }}
                />
                <Stack.Screen
                  name="NewBug"
                  component={NewBugScreen}
                  options={{ title: "Registrar bug" }}
                />
              </>
            ) : (
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </UserContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
