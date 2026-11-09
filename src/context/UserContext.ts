import type { User } from "firebase/auth";
import { createContext, useContext } from "react";

// Compartilha o usuário logado com as telas sem passar props manualmente.
export const UserContext = createContext<User | null>(null);

export function useUser(): User {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser só pode ser usado com um usuário logado.");
  }
  return user;
}
