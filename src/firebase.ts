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
  apiKey: "AIzaSyBCDFC2U-IpAZv7iWvXn_MRzcUGN7cneVM",
  authDomain: "bugbox-2612a.firebaseapp.com",
  projectId: "bugbox-2612a",
  storageBucket: "bugbox-2612a.firebasestorage.app",
  messagingSenderId: "96381352256",
  appId: "1:96381352256:web:6af31046400baa4ef1a2a5",
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
