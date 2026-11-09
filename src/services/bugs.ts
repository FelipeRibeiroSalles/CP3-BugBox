import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";

import { db } from "../firebase";

export type Severity = "baixa" | "media" | "alta" | "critica";
export type BugStatus = "aberto" | "resolvido";

export type Bug = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: BugStatus;
  createdAt: Date | null;
};

// Dados que o usuário preenche ao criar um bug.
export type NewBug = Pick<Bug, "title" | "description" | "severity">;

const SEVERITIES: Severity[] = ["baixa", "media", "alta", "critica"];

// Cada usuário tem a própria subcoleção: users/{uid}/bugs
function bugsCollection(uid: string) {
  return collection(db, "users", uid, "bugs");
}

// Escuta os bugs em tempo real, do mais novo para o mais antigo.
// Retorna a função que cancela a escuta.
export function listenBugs(
  uid: string,
  onData: (bugs: Bug[]) => void,
  onError: (error: Error) => void
) {
  const bugsQuery = query(bugsCollection(uid), orderBy("createdAt", "desc"));

  return onSnapshot(
    bugsQuery,
    (snapshot) => {
      const bugs = snapshot.docs.map((item): Bug => {
        // "estimate" usa o horário local enquanto o servidor não confirma.
        const data = item.data({ serverTimestamps: "estimate" });
        const createdAt = data.createdAt as Timestamp | null | undefined;

        return {
          id: item.id,
          title: String(data.title ?? ""),
          description: String(data.description ?? ""),
          severity: SEVERITIES.includes(data.severity)
            ? (data.severity as Severity)
            : "media",
          status: data.status === "resolvido" ? "resolvido" : "aberto",
          createdAt: createdAt ? createdAt.toDate() : null,
        };
      });

      onData(bugs);
    },
    onError
  );
}

export async function addBug(uid: string, bug: NewBug) {
  await addDoc(bugsCollection(uid), {
    title: bug.title.trim(),
    description: bug.description.trim(),
    severity: bug.severity,
    status: "aberto",
    createdAt: serverTimestamp(),
  });
}

// Alterna entre "aberto" e "resolvido".
export async function toggleBugStatus(uid: string, bug: Bug) {
  await updateDoc(doc(db, "users", uid, "bugs", bug.id), {
    status: bug.status === "aberto" ? "resolvido" : "aberto",
  });
}

export async function removeBug(uid: string, bugId: string) {
  await deleteDoc(doc(db, "users", uid, "bugs", bugId));
}
