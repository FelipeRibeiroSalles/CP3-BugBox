import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

// Cria a conta no Authentication e o perfil em users/{uid} no Firestore.
export async function register(name: string, email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  await updateProfile(user, { displayName: name.trim() });

  await setDoc(doc(db, "users", user.uid), {
    name: name.trim(),
    email: user.email,
    createdAt: serverTimestamp(),
  });
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logout() {
  await signOut(auth);
}

// Escuta o documento de perfil para mostrar o nome salvo no Firestore.
export function listenProfileName(
  uid: string,
  onName: (name: string) => void
) {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      const name = snapshot.data()?.name;
      if (typeof name === "string" && name.length > 0) onName(name);
    },
    () => {
      // Sem perfil, a tela continua usando o nome do Auth ou o e-mail.
    }
  );
}

const messages: Record<string, string> = {
  "auth/invalid-email": "O e-mail informado é inválido.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Já existe uma conta com esse e-mail.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/too-many-requests":
    "Muitas tentativas seguidas. Espere um pouco e tente de novo.",
  "auth/network-request-failed": "Sem conexão com a internet.",
  "auth/operation-not-allowed":
    "O login por e-mail e senha não está ativado no Firebase.",
  "permission-denied":
    "Acesso negado pelo banco. Confira as regras do Firestore.",
  unavailable: "Serviço indisponível. Verifique sua conexão.",
};

// Traduz os erros do Firebase para mensagens que o usuário entende.
export function errorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return messages[error.code] ?? "Algo deu errado. Tente novamente.";
  }
  if (error instanceof Error) return error.message;
  return "Erro inesperado.";
}
