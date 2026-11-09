import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUser } from "../context/UserContext";
import { confirmAction, showMessage } from "../dialog";
import type { RootStackParamList } from "../navigation/types";
import { errorMessage, listenProfileName, logout } from "../services/auth";
import {
  listenBugs,
  removeBug,
  toggleBugStatus,
  type Bug,
} from "../services/bugs";
import { colors, severityInfo } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Bugs">;
type Filter = "todos" | "aberto" | "resolvido";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "aberto", label: "Abertos" },
  { key: "resolvido", label: "Resolvidos" },
];

export default function BugListScreen({ navigation }: Props) {
  const user = useUser();

  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filter, setFilter] = useState<Filter>("todos");
  const [name, setName] = useState(user.displayName ?? "");

  // Botão de sair no cabeçalho do Stack.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={confirmLogout}
          hitSlop={10}
          accessibilityLabel="Sair da conta"
        >
          <Ionicons name="log-out-outline" size={24} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation]);

  // Nome salvo no perfil do Firestore (users/{uid}).
  useEffect(() => {
    return listenProfileName(user.uid, setName);
  }, [user.uid]);

  // Lista de bugs em tempo real. Roda de novo ao tocar em "Tentar novamente".
  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    const unsubscribe = listenBugs(
      user.uid,
      (list) => {
        setBugs(list);
        setLoading(false);
      },
      (error) => {
        setLoadError(errorMessage(error));
        setLoading(false);
      }
    );

    // Limpeza: cancela a escuta ao sair da tela ou antes de escutar de novo.
    return unsubscribe;
  }, [user.uid, retryCount]);

  const openCount = useMemo(
    () => bugs.filter((bug) => bug.status === "aberto").length,
    [bugs]
  );

  const visibleBugs = useMemo(
    () =>
      filter === "todos" ? bugs : bugs.filter((bug) => bug.status === filter),
    [bugs, filter]
  );

  function confirmLogout() {
    confirmAction("Sair", "Deseja sair da sua conta?", "Sair", async () => {
      try {
        await logout();
      } catch (error) {
        showMessage("Não foi possível sair", errorMessage(error));
      }
    });
  }

  async function handleToggle(bug: Bug) {
    try {
      await toggleBugStatus(user.uid, bug);
    } catch (error) {
      showMessage("Não foi possível atualizar", errorMessage(error));
    }
  }

  function confirmDelete(bug: Bug) {
    confirmAction(
      "Excluir bug",
      `Excluir "${bug.title}"? Isso não pode ser desfeito.`,
      "Excluir",
      async () => {
        try {
          await removeBug(user.uid, bug.id);
        } catch (error) {
          showMessage("Não foi possível excluir", errorMessage(error));
        }
      }
    );
  }

  function renderBug({ item }: { item: Bug }) {
    const severity = severityInfo[item.severity];
    const resolved = item.status === "resolvido";

    return (
      <Pressable
        style={[styles.card, resolved && styles.cardResolved]}
        onPress={() => handleToggle(item)}
        onLongPress={() => confirmDelete(item)}
      >
        <Ionicons
          name={resolved ? "checkmark-circle" : "ellipse-outline"}
          size={26}
          color={resolved ? colors.success : colors.muted}
        />

        <View style={styles.cardBody}>
          <Text
            style={[styles.cardTitle, resolved && styles.cardTitleResolved]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {item.description.length > 0 && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View style={[styles.badge, { borderColor: severity.color }]}>
              <Text style={[styles.badgeText, { color: severity.color }]}>
                {severity.label}
              </Text>
            </View>
            {item.createdAt && (
              <Text style={styles.date}>
                {item.createdAt.toLocaleDateString("pt-BR")}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => confirmDelete(item)}
          hitSlop={10}
          accessibilityLabel="Excluir bug"
        >
          <Ionicons name="trash-outline" size={20} color={colors.muted} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Olá, {name || user.email}
        </Text>
        <Text style={styles.summary}>
          {openCount} aberto(s) · {bugs.length - openCount} resolvido(s)
        </Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((option) => (
          <Pressable
            key={option.key}
            style={[styles.chip, filter === option.key && styles.chipActive]}
            onPress={() => setFilter(option.key)}
          >
            <Text
              style={[
                styles.chipText,
                filter === option.key && styles.chipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
          <Text style={styles.message}>{loadError}</Text>
          <Pressable
            style={styles.retry}
            onPress={() => setRetryCount((count) => count + 1)}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleBugs}
          keyExtractor={(item) => item.id}
          renderItem={renderBug}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="bug-outline" size={40} color={colors.muted} />
              <Text style={styles.message}>
                {bugs.length === 0
                  ? "Nenhum bug registrado ainda. Toque em + para começar."
                  : "Nenhum bug nesse filtro."}
              </Text>
            </View>
          }
        />
      )}

      {!loading && !loadError && bugs.length > 0 && (
        <Text style={styles.hint}>
          Toque para marcar como resolvido · segure para excluir
        </Text>
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("NewBug")}
        accessibilityLabel="Registrar bug"
      >
        <Ionicons name="add" size={30} color={colors.background} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, gap: 4 },
  greeting: { color: colors.text, fontSize: 22, fontWeight: "700" },
  summary: { color: colors.muted, fontSize: 14 },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: "600" },
  chipTextActive: { color: colors.background },
  list: { paddingHorizontal: 20, paddingBottom: 110, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardResolved: { opacity: 0.6 },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cardTitleResolved: { textDecorationLine: "line-through" },
  cardDescription: { color: colors.muted, fontSize: 14 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  date: { color: colors.muted, fontSize: 12 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  message: { color: colors.muted, fontSize: 15, textAlign: "center" },
  retry: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: colors.primary, fontWeight: "700" },
  hint: {
    position: "absolute",
    bottom: 34,
    left: 20,
    right: 96,
    color: colors.muted,
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
