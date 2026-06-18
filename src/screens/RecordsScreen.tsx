import { clearAll } from "@/utils/clearAll";
import { exportPDF } from "@/utils/exportPdf";
import { exportZIP } from "@/utils/exportZip";
import { sortCollections } from "@/utils/sortCollections";
import { updateMissingLocations } from "@/utils/updateMissingLocations";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList, Image, StyleSheet, Text,
  TouchableOpacity,
  View
} from "react-native";
import { RootStackParamList } from "../routes/types";
import { colors } from "../styles/colors";
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Props = {
  navigation: NavigationProp;
};

export default function RecordsScreen({ navigation }: Props) {
  const router = useRouter();
  const [visibleItems, setVisibleItems] = useState(5);
  const [data, setData] = useState<any[]>([]);
  const [ascending, setAscending] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);
  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [])
  );

  const loadCollections = async () => {
    const saved = await AsyncStorage.getItem("collections");
    const collections = saved ? JSON.parse(saved) : [];

    const updatedCollections =
      await updateMissingLocations(collections);

    setData(sortCollections(updatedCollections, true));
    setVisibleItems(5);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.title}>Coletas realizadas {data.length > 0 ? `(${data.length})` : ""}</Text>
      </View>
      <View style={styles.actions}>
         <TouchableOpacity
          style={[
            styles.actionButton,
            loadingZip && { opacity: 0.7 }
          ]}
          disabled={loadingZip}
          onPress={() => exportZIP(data, setLoadingZip)}
        >
          {loadingZip ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="folder-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.actionText}>ZIP</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            loadingPdf && { opacity: 0.7 }
          ]}
          disabled={loadingPdf}
          onPress={() => exportPDF(data, setLoadingPdf)}
        >
          {loadingPdf ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.actionText}>PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => clearAll(data, setData)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Apagar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.sortLink}
        onPress={() => {
          const sorted = sortCollections(data, ascending);

          setData(sorted);
          setAscending(!ascending);
        }}
      >
        <Ionicons
          name="swap-vertical-outline"
          size={16}
          color={colors.primary}
        />
        <Text style={styles.sortText}>
          {ascending ? "Ordenado: mais antigos" : "Ordenado: mais recentes"}
        </Text>
      </TouchableOpacity>
      {/* LISTA */}
      <FlatList
        data={data.slice(0, visibleItems)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={50} color={colors.medium} />
            <Text style={styles.emptyText}>
              Nenhuma coleta salva ainda
            </Text>
            <Text style={styles.emptySubText}>
              As coletas aparecerão aqui após serem registradas
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RecordDetails", { item })}
            activeOpacity={0.85}
          >
            <View style={styles.iconBox}>
              <Image
                source={{ uri: item.foto }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.tipoColeta}
              </Text>

              <Text style={styles.cardText} numberOfLines={1}>
                {item.local}
              </Text>

              <Text style={styles.cardDate}>
                {item.data} - {item.hora}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.medium}
            />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          visibleItems < data.length ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setVisibleItems((prev) => prev + 5)}
            >
              <Text style={styles.loadMoreText}>
                Carregar mais
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 18,
  },

  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.medium,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },

  deleteButton: {
    backgroundColor: colors.warning,
  },

  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  sortLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 18,
    gap: 4,
    paddingBottom: 2,
  },

  sortText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 18,
    backgroundColor: colors.dark,
    borderBottomWidth: 4,
    borderBottomColor: colors.primary,
  },

  backButton: {
    marginRight: 12,
    padding: 6,
  },

  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
  },

  listContent: {
    padding: 18,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",

    // sombra mais suave
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  iconBox: {
    width: 70,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#EAF7F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  thumbnail: {
    width: 80,
    height: 100,
    borderRadius: 14,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
  },

  cardText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
  },

  cardDate: {
    fontSize: 12,
    color: colors.medium,
    marginTop: 6,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: colors.medium,
  },

  emptySubText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.medium,
    textAlign: "center",
  },

  loadMoreButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  loadMoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});