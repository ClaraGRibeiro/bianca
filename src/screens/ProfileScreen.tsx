import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { default as React, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import pesquisas from "../data/tipos_de_pesquisa.json";
import { colors } from "../styles/colors";
type Pesquisa = {
  id: number;
  research: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [preference, setPreference] = useState("");
  const [savedName, setSavedName] = useState("");
  const [savedPreference, setSavedPreference] = useState("");

  const hasChanges =
    name !== savedName ||
    preference !== savedPreference;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const storedName = await AsyncStorage.getItem("user_name");
    const storedPreference = await AsyncStorage.getItem("user_preference");

    setSavedName(storedName || "");
    setSavedPreference(storedPreference || "");

    setName(storedName || "");
    setPreference(storedPreference || "");
  };

  const saveProfile = async () => {
    await AsyncStorage.setItem("user_name", name.trim());
    await AsyncStorage.setItem("user_preference", preference.trim());

    setSavedName(name);
    setSavedPreference(preference);

    setSavedName(name);
    setSavedPreference(preference);

    Alert.alert("Sucesso", "Perfil salvo no dispositivo");
  };

  const resetProfile = async () => {
    await AsyncStorage.setItem("user_name", "");
    await AsyncStorage.setItem("user_preference", "");

    setName("");
    setPreference("");

    setSavedName("");
    setSavedPreference("");

    Alert.alert("Sucesso", "Perfil salvo no dispositivo");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Perfil</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={70} color={colors.white} />
          </View>
          <Text style={styles.name}>{name.trim() !== "" ? name : "NOME A DEFINIR"}</Text>
          <Text style={styles.role}>
            {preference !== ""
              ? `Preferência: ${preference}`
              : "PREFERÊNCIA A DEFINIR"}
          </Text>
          <View style={styles.form}>
            <Text style={styles.label}>Nome do pesquisador</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Preferência de coleta</Text>
            <View style={styles.selectContainer}>
              <Picker
                selectedValue={preference}
                onValueChange={(itemValue) => setPreference(itemValue)}
                style={styles.select}
                dropdownIconColor={colors.dark}
              >
                <Picker.Item
                  label="Selecione uma preferência"
                  value=""
                  color="#777"
                />

                {pesquisas.map((item: Pesquisa) => (
                  <Picker.Item
                    key={item.id}
                    label={item.research}
                    value={item.research}
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={[
                styles.button,
                hasChanges && {
                  backgroundColor: colors.warning,
                },
              ]}
              activeOpacity={0.85}
              onPress={saveProfile}
            >
              <Text style={styles.buttonText} disabled={!hasChanges}>
                {hasChanges
                  ? "Salvar alterações"
                  : "Configurações salvas"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.reset]}
              activeOpacity={0.85}
              onPress={resetProfile}
            >
              <Text style={styles.buttonText}>
                Redefinir dados
              </Text>
            </TouchableOpacity>
          </View>
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

  backButton: {
    marginBottom: 12,
  },

  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "bold",
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },

  avatar: {
    width: 125,
    height: 125,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.dark,
  },

  role: {
    color: colors.medium,
    marginTop: 6,
    marginBottom: 32,
    fontSize: 16,
  },

  form: {
    width: "100%",
  },

  label: {
    color: colors.dark,
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 15,
  },

  input: {
    backgroundColor: colors.white,
    color: colors.dark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  selectContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    marginBottom: 20,
    overflow: "hidden",
  },

  select: {
    color: colors.dark,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  reset: {
    backgroundColor: colors.dark,
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
