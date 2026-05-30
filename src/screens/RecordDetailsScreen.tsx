import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  ScrollView, StyleSheet, Text,
  TouchableOpacity,
  View
} from "react-native";

import pesquisas from "../data/tipos_de_pesquisa.json";
import { RootStackParamList } from "../routes/types";
import { colors } from "../styles/colors";

type Props = {
  route: RouteProp<RootStackParamList, "RecordDetails">;
};

export default function RecordDetailsScreen({ route }: Props) {
  const { item } = route.params;
  const router = useRouter();

  const pesquisaAtual = pesquisas.find(
    (p) => p.research === item.tipoColeta
  );

  const getValue = (fieldId: string) =>
    item.respostas?.[fieldId] ?? "Não informado";

  const deleteCollection = async () => {
    Alert.alert("Excluir coleta", "Deseja realmente excluir esta coleta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const saved = await AsyncStorage.getItem("collections");
          const collections = saved ? JSON.parse(saved) : [];

          const updated = collections.filter(
            (c: any) => c.id !== item.id
          );

          await AsyncStorage.setItem(
            "collections",
            JSON.stringify(updated)
          );

          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.scrollContent}>
      {/* HEADER (igual Register) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Detalhes da Coleta</Text>
      </View>

      <View style={styles.form}>
        {/* INFO CARD (igual Register) */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informações da Coleta</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pesquisador</Text>
            <Text style={styles.infoValue}>{item.pesquisador}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de coleta</Text>
            <Text style={styles.infoValue}>{item.tipoColeta}</Text>
          </View>

          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data e Hora</Text>
            <Text style={styles.infoValue}>{item.data} - {item.hora}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Localização</Text>
            <Text style={styles.infoValue}>{item.local}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.infoLabel}>Latitude</Text>
              <Text style={styles.coordinate}>{item.latitude}</Text>
            </View>

            <View style={styles.half}>
              <Text style={styles.infoLabel}>Longitude</Text>
              <Text style={styles.coordinate}>{item.longitude}</Text>
            </View>
          </View>
        </View>

        {/* SEPARADOR IGUAL REGISTER */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionLine} />
          <View style={styles.sectionBadge}>
            <Ionicons
              name="document-text-outline"
              size={18}
              color={colors.white}
            />
          </View>
          <View style={styles.sectionLine} />
        </View>

        <Text style={styles.sectionTitle}>Dados da Coleta</Text>

        {/* FOTO */}
        {item.foto && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: item.foto }} style={styles.photo} />
          </View>
        )}

        {/* CAMPOS DINÂMICOS (modo leitura estilo Register) */}
        {pesquisaAtual?.fields?.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>

            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>
                {getValue(field.id)}
              </Text>
            </View>
          </View>
        ))}

        {/* BOTÃO DELETE */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deleteCollection}
        >
          <Ionicons name="trash-outline" size={20} color={colors.white} />
          <Text style={styles.deleteText}>Excluir coleta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.dark,
    padding: 22,
    paddingTop: 52,
    borderBottomWidth: 5,
    borderBottomColor: colors.primary,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "bold",
  },

  form: {
    padding: 18,
  },

  // INFO CARD (igual Register)
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.gray,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 18,
  },

  infoRow: {
    gap: 4,
  },

  infoLabel: {
    fontSize: 13,
    color: colors.medium,
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 12,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  half: {
    flex: 1,
  },

  coordinate: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark,
  },

  // SECTION (igual Register)
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray,
  },

  sectionBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 14,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 14,
  },

  // CAMPOS DINÂMICOS
  fieldContainer: {
    marginBottom: 18,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  readOnlyBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 14,
  },

  readOnlyText: {
    fontSize: 15,
    color: colors.text,
  },

  // FOTO
  photoContainer: {
    marginBottom: 18,
  },

  photo: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray,
  },

  // DELETE
  deleteButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  deleteText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});