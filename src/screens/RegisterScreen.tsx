import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import pesquisas from "../data/tipos_de_pesquisa.json";
import { colors } from "../styles/colors";
type Field = {
  id: string;
  label: string;
  type: "select" | "textarea" | "number" | "text";
  options?: string[];
  placeholder?: string;
};

type Pesquisa = {
  id: number;
  research: string;
  fields: Field[];
};

export default function RegisterScreen() {

  const checkProfile = async () => {
    const name = await AsyncStorage.getItem("user_name");
    const preference = await AsyncStorage.getItem("user_preference");

    if (!name || !preference) {
      Alert.alert(
        "Perfil incompleto",
        "Você precisa configurar seu nome e tipo de coleta antes de registrar uma coleta.",
        [
          {
            text: "Ir para configuração",
            onPress: () => navigation.navigate("Register")

          },
        ]
      );

      return false;
    }

    return true;
  };
  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        const ok = await checkProfile();
        if (!ok) return;
      };

      run();
    }, [])
  );
  const loadDefaults = async () => {
    const savedName = await AsyncStorage.getItem("user_name");
    const savedPreference = await AsyncStorage.getItem("user_preference");

    if (savedName) setPesquisador(savedName);

    if (savedPreference) setTipoColeta(savedPreference);
  };
  const [pesquisador, setPesquisador] = useState("");
  const [tipoColeta, setTipoColeta] = useState("");
  const [local, setLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const pesquisaAtual = (pesquisas as Pesquisa[]).find(
    (p) => p.research === tipoColeta
  );
  const [photoUri, setPhotoUri] = useState("");

  useEffect(() => {
    loadDefaults();
    captureLocation();
  }, []);
  const captureLocation = async () => {
    setLocal("Obtendo local...")
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];

        setLocal(
          [addr.name, addr.street, addr.streetNumber, addr.district, addr.subregion, addr.city, addr.region, addr.postalCode, addr.country,]
            .filter(Boolean)
            .join(", ")
        );
      }
    } catch (error) {
      setLocal("Sem Localização")
    }
  };
  const pickImage = async () => {
    await ImagePicker.requestCameraPermissionsAsync();

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!pesquisador.trim()) errors.push("Pesquisador é obrigatório");
    if (!tipoColeta.trim()) errors.push("Tipo de coleta é obrigatório");
    if (!local.trim()) errors.push("Localização é obrigatória");
    if (!latitude || !longitude) errors.push("Localização GPS não obtida");
    if (!photoUri) errors.push("Foto é obrigatória");

    pesquisaAtual?.fields?.forEach((field) => {
      const value = formData[field.id];

      if (!value || value.toString().trim() === "") {
        errors.push(`${field.label} é obrigatório`);
      }
    });

    return errors;
  };

  const saveCollection = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      Alert.alert(
        "Campos obrigatórios",
        errors.join("\n")
      );
      return;
    }

    try {
      const now = new Date();

      const novaColeta = {
        id: Date.now().toString(),
        pesquisador,
        tipoColeta,
        local,
        latitude,
        longitude,

        foto: photoUri,

        timestamp: now.toISOString(),

        respostas: formData,

        data: now.toLocaleDateString("pt-BR"),
        hora: now.toLocaleTimeString("pt-BR"),
      };

      const saved = await AsyncStorage.getItem("collections");
      const list = saved ? JSON.parse(saved) : [];

      list.push(novaColeta);

      await AsyncStorage.setItem("collections", JSON.stringify(list));

      Alert.alert("Sucesso", "Coleta salva offline");
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar");
    }
  };

  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Coleta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Informações da Coleta</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pesquisador</Text>
              <Text style={styles.infoValue}>{pesquisador}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo de coleta</Text>
              <Text style={styles.infoValue}>{tipoColeta}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Localização</Text>
              <Text style={styles.infoValue}>
                {local || "Obtendo localização..."}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.infoLabel}>Latitude</Text>
                <Text style={styles.coordinate}>
                  {latitude || "..."}
                </Text>
              </View>

              <View style={styles.half}>
                <Text style={styles.infoLabel}>Longitude</Text>
                <Text style={styles.coordinate}>
                  {longitude || "..."}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.sectionDivider}>
            <View style={styles.sectionLine} />

            <View style={styles.sectionBadge}>
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.white}
              />
            </View>

            <View style={styles.sectionLine} />
          </View>

          <Text style={styles.sectionTitle}>
            Dados da Coleta
          </Text>

          <Text style={styles.sectionSubtitle}>
            Preencha as informações observadas no local.
          </Text>
          {pesquisaAtual?.fields?.map((field) => {
            if (!field?.type) return null;

            return (
              <View key={field.id} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>

                {field.type === "select" && (
                  <View style={styles.selectContainer}>
                    <Picker
                      dropdownIconColor={colors.medium}
                      selectedValue={formData[field.id] || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field.id]: value,
                        }))
                      }
                      style={{
                        color: colors.dark,
                      }}
                    >
                      <Picker.Item
                        label={field.placeholder}
                        value=""
                        color={colors.gray}
                      />

                      {field.options?.map((option) => (
                        <Picker.Item
                          key={option}
                          label={option}
                          value={option}
                        />
                      ))}
                    </Picker>
                  </View>
                )}

                {field.type === "textarea" && (
                  <TextInput
                    style={styles.fieldTextArea}
                    multiline
                    placeholder="Digite aqui..."
                    placeholderTextColor={colors.primary}
                    value={formData[field.id] || ""}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.id]: text,
                      }))
                    }
                  />
                )}

                {(field.type === "text" || field.type === "number") && (
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType={
                      field.type === "number"
                        ? "numeric"
                        : "default"
                    }
                    value={formData[field.id] || ""}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.id]: text,
                      }))
                    }
                  />
                )}
              </View>
            );
          })}

          {photoUri === "" &&
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={pickImage}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={colors.medium}
              />
              <Text style={styles.secondaryButtonText}>
                Abrir câmera
                {/* NEGADO */}
              </Text>
            </TouchableOpacity>
          }

          {photoUri !== "" && (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photoUri }}
                style={styles.photo}
                resizeMode="cover"
              />

              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setPhotoUri("")}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={saveCollection}>
            <Text style={styles.primaryButtonText}>Salvar coleta offline</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  backButton: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
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

  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.dark,
  },

  input: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray,
  },

  textArea: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray,
    textAlignVertical: "top",
    marginBottom: 18,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  half: {
    flex: 1,
  },

  secondaryButton: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.medium,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
    backgroundColor: colors.white,
  },

  secondaryButtonText: {
    color: colors.medium,
    fontWeight: "bold",
  },

  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

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

  coordinate: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 12,
  },
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
    marginBottom: 4,
  },
  fieldContainer: {
    marginBottom: 22,
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
  fieldInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
  },

  fieldTextArea: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    color: colors.text,
  },

  selectContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    overflow: "hidden",
  },
  sectionSubtitle: {
    color: colors.medium,
    marginBottom: 18,
    fontSize: 14,
  },
  fieldCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  photoContainer: {
    position: "relative",
    paddingBottom: 10,
  },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  removePhotoButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
});