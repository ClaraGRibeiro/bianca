import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useState } from "react";
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

import { useFocusEffect } from "expo-router";
import { RootStackParamList } from "../routes/types";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedPreference, setSavedPreference] = useState<string | null>(null);
  const loadProfile = async () => {
    const storedName = await AsyncStorage.getItem("user_name");
    const storedPreference = await AsyncStorage.getItem("user_preference");

    setSavedName(storedName);
    setSavedPreference(storedPreference);
  };
  useFocusEffect( useCallback(() => { loadProfile(); }, []) );
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>OTMG / NUMOB</Text>
        <Text style={styles.title}>BIANCA</Text>

        <Text style={styles.description}>
          Base Integrada de Análise, Navegação, Coleta e Armazenamento
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons
            name="person-circle-outline"
            size={42}
            color={colors.primary}
          />

          <Text style={styles.cardTitle}>Perfil {(!savedName || !savedPreference) && "Incompleto"}</Text>

          <Text style={styles.cardText}>Configurações do pesquisador.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            (!savedName || !savedPreference) && styles.cardDisabled,
          ]}
          disabled={!savedName || !savedPreference}
          onPress={() => navigation.navigate("Register")}
        >
          <Ionicons
            name="add-circle-outline"
            size={42}
            color={colors.primary}
          />
          <Text style={styles.cardTitle}>Nova Coleta</Text>
          {(!savedName || !savedPreference) ?
            <Text style={styles.cardText}>Para realizar uma coleta, complete seu perfil.</Text>
            :
            <Text style={styles.cardText}>
              Registrar uma nova coleta de campo.
            </Text>
          }
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
  cardDisabled: {
    opacity: 0.5,
  },
});
