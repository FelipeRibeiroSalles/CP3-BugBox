import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseError, getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do app Web cadastrado no Firebase Console
// (Configurações do projeto → Seus apps → Web).
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

// Reaproveita o app se ele já foi criado (acontece no recarregamento do Expo).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// O Auth guarda a sessão no AsyncStorage: quem fez login continua logado
// quando fecha e abre o app de novo.
function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "auth/already-initialized"
    ) {
      return getAuth(app);
    }
    throw error;
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
