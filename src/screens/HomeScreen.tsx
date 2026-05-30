import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "../styles/colors";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../routes/types";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Coleta de dados em campo</Text>
        <Text style={styles.title}>OTMG Coleta</Text>

        <Text style={styles.description}>
          Aplicativo de coleta padronizada de dados offline.
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Register")}
        >
          <Ionicons
            name="add-circle-outline"
            size={42}
            color={colors.primary}
          />

          <Text style={styles.cardTitle}>Nova Coleta</Text>

          <Text style={styles.cardText}>
            Registrar uma nova coleta de campo.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Records")}
        >
          <Ionicons name="documents-outline" size={42} color={colors.primary} />

          <Text style={styles.cardTitle}>Coletas</Text>

          <Text style={styles.cardText}>
            Visualizar registros salvos offline.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons
            name="person-circle-outline"
            size={42}
            color={colors.primary}
          />

          <Text style={styles.cardTitle}>Perfil</Text>

          <Text style={styles.cardText}>Configurações do pesquisador.</Text>
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
  header: {
    backgroundColor: colors.dark,
    padding: 24,
    paddingTop: 52,
    borderBottomWidth: 5,
    borderBottomColor: colors.primary,
  },

  subtitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  title: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "bold",
  },

  description: {
    color: colors.white,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },

  cardsContainer: {
    padding: 18,
    gap: 16,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 22,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark,
    marginTop: 14,
    marginBottom: 8,
  },

  cardText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});
