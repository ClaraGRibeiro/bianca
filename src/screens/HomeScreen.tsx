import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { Animated } from "react-native";
import { RootStackParamList } from "../routes/types";
import { colors } from "../styles/colors";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
  const [highlight, setHighlight] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedPreference, setSavedPreference] = useState<string | null>(null);
  const [gps, setGps] = useState(false);
  const [camera, setCamera] = useState(false);
  const [media, setMedia] = useState(false);
  const [collections, setcollections] = useState(0);
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (state) => {
        if (state === "active") {
          await loadProfile();
        }
      }
    );

    return () => subscription.remove();
  }, []);
  const collectionsQtd = async () => {
    const collection = await AsyncStorage.getItem("collections");
    const total = collection ? JSON.parse(collection).length : 0;

    if (total > collections) {
      setHighlight(true);

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setHighlight(false);
      }, 1500);
    }

    setcollections(total);
  };
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      collectionsQtd()
    }, []));
  useEffect(() => {
    checkLocationPermission();
    checkCameraPermission();
    checkMediaPermission();
  }, []);
  const checkLocationPermission = async () => {
    const { granted } =
      await Location.getForegroundPermissionsAsync();
    setGps(granted);
  };
  const checkCameraPermission = async () => {
    const { granted } =
      await ImagePicker.getCameraPermissionsAsync();

    setCamera(granted);
  };
  const checkMediaPermission = async () => {
    const { granted } =
      await ImagePicker.getMediaLibraryPermissionsAsync();

    setMedia(granted);
  };
  const loadProfile = async () => {
    const storedName = await AsyncStorage.getItem("user_name");
    const storedPreference = await AsyncStorage.getItem("user_preference");
    setSavedName(storedName);
    setSavedPreference(storedPreference);
  };
  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>OTMG / NUMOB</Text>
        <Text style={styles.title}>BIANCA</Text>

        <Text style={styles.description}>
          Base Integrada de Análise, Navegação, Coleta e Armazenamento
        </Text>
      </View>

      <View style={styles.cardsContainer}>

        <TouchableOpacity
          style={[
            styles.card,
            (!savedName || !savedPreference || !gps || !camera || !media) && styles.cardDisabled,
          ]}
          disabled={!savedName || !savedPreference || !gps || !camera || !media}
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
            !gps ?
              <Text style={styles.cardText}>Para realizar uma coleta, permita o uso do GPS.</Text>
              :
              !camera ?
                <Text style={styles.cardText}>Para realizar uma coleta, permita o uso da câmera.</Text>
                :
                !media ?
                  <Text style={styles.cardText}>Para realizar uma coleta, permita o uso da mídia.</Text>
                  :
                  <Text style={styles.cardText}>
                    Registrar uma nova coleta de campo.
                  </Text>
          }
        </TouchableOpacity>
        {!gps &&
          <TouchableOpacity
            style={styles.card}
            onPress={async () => {
              const permission =
                await Location.getForegroundPermissionsAsync();

              if (!permission.granted) {
                Linking.openSettings()
                return;
              }

              const { granted } =
                await Location.requestForegroundPermissionsAsync();

              setGps(granted);
            }}
          >
            <Ionicons
              name="compass-outline"
              size={42}
              color={colors.primary}
            />

            <Text style={styles.cardTitle}>Acesso ao GPS negado</Text>

            <Text style={styles.cardText}>
              Necessário para buscar a localização das coletas.
            </Text>
          </TouchableOpacity>
        }

        {!camera &&
          <TouchableOpacity
            style={styles.card}
            onPress={async () => {
              const permission =
                await ImagePicker.getCameraPermissionsAsync();

              if (!permission.granted) {
                Linking.openSettings();
                return;
              }

              const { granted } =
                await ImagePicker.requestCameraPermissionsAsync();

              setCamera(granted);
            }}
          >
            <Ionicons
              name="camera-outline"
              size={42}
              color={colors.primary}
            />

            <Text style={styles.cardTitle}>
              Acesso à câmera negado
            </Text>

            <Text style={styles.cardText}>
              Necessário para capturar imagens durante as coletas.
            </Text>
          </TouchableOpacity>
        }
        {!media &&
          <TouchableOpacity
            style={styles.card}
            onPress={async () => {
              const permission =
                await ImagePicker.getMediaLibraryPermissionsAsync();

              if (!permission.granted) {
                Linking.openSettings();
                return;
              }

              const { granted } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

              setMedia(granted);
            }}
          >
            <Ionicons
              name="folder-outline"
              size={42}
              color={colors.primary}
            />

            <Text style={styles.cardTitle}>
              Acesso à mídia negado
            </Text>

            <Text style={styles.cardText}>
              Necessário para exportar dados das coletas.
            </Text>
          </TouchableOpacity>
        }

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Records")}
        >
          <Ionicons name="documents-outline" size={42} color={colors.primary} />

          <Animated.Text
            style={[
              styles.cardTitle,
            ]}
          >
            Coletas{" "}
            {collections > 0 && (
              <Text
                style={{
                  color: highlight ? "#16a34a" : colors.dark,
                  fontSize: highlight ? 22 : 20,
                }}
              >
                ({collections})
              </Text>
            )}
          </Animated.Text>

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

          <Text style={styles.cardTitle}>Perfil {(!savedName || !savedPreference) && "Incompleto"}</Text>

          <Text style={styles.cardText}>Configurações do pesquisador.</Text>
        </TouchableOpacity>
      </View>
    </ScrollView >
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
