import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  FlatList, StyleSheet, Text,
  TouchableOpacity,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback } from "react";
import { Alert } from "react-native";
import { RootStackParamList } from "../routes/types";
import { colors } from "../styles/colors";
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Props = {
  navigation: NavigationProp;
};
export default function RecordsScreen({ navigation }: Props) {
  const exportCSV = async () => {
    Alert.alert("Aviso", "CSV exportado");

    // if (data.length === 0) {
    //   Alert.alert("Aviso", "Não há dados para exportar");
    //   return;
    // }

    // const header = "id,tipoColeta,local,data,hora\n";

    // const rows = data
    //   .map((item) =>
    //     `${item.id},"${item.tipoColeta}","${item.local}","${item.data}","${item.hora}"`
    //   )
    //   .join("\n");

    // const csv = header + rows;

    // const fileUri = FileSystem.documentDirectory + "coletas.csv";

    // await FileSystem.writeAsStringAsync(fileUri, csv, {
    //   encoding: FileSystem.EncodingType.UTF8,
    // });

    // await Sharing.shareAsync(fileUri);
  };
  const uriToBase64 = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };
  const exportPDF = async () => {
    if (data.length === 0) {
      Alert.alert("Aviso", "Não há dados para exportar");
      return;
    }

    const dataWithImages = await Promise.all(
      data.map(async (item) => ({
        ...item,
        fotoBase64: item.foto ? await uriToBase64(item.foto) : null,
      }))
    );
    const html = `
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório OTMG Coleta</title>

  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      background: #f4f7f6;
      color: #3d3d3c;
    }

    header {
      background: #133a44;
      color: white;
      padding: 22px 28px;
      border-bottom: 4px solid #0aa689;
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    h1 {
      margin: 0;
      font-size: 22px;
    }

    .subtitle {
      opacity: 0.8;
      font-size: 13px;
    }

    main {
      padding: 24px 28px;
    }

    .record {
      background: #fff;
      border: 1px solid #d7dfdc;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 18px;
      page-break-inside: avoid;
      box-shadow: 0 10px 26px rgba(0,0,0,0.06);
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      align-items: start;
    }

    h2 {
      margin: 0 0 10px;
      color: #133a44;
      font-size: 18px;
    }

    p {
      margin: 6px 0;
      font-size: 13px;
    }

    strong {
      color: #133a44;
    }

    .photo {
      width: 60%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #d7dfdc;
      background: #eef2f7;

      display: block;
      margin-left: auto;
    }

    .muted {
      color: #64706d;
      font-size: 12px;
    }

   footer {
  background: #133a44;
  color: white;
  padding: 16px 28px;
  border-top: 4px solid #0aa689;
  font-size: 12px;

  display: flex;
  justify-content: space-between;
  align-items: center;
}
  .footer-logos {
  display: flex;
  gap: 14px;
  align-items: center;
}

.footer-logos img {
  height: 32px;
  width: auto;
}
  </style>
</head>

<body>

  <header>
    <div class="brand">
      <h1>Relatório OTMG Coleta</h1>
      <div class="subtitle">
        Gerado em ${new Date().toISOString()} — Total: ${data.length} registros
      </div>
    </div>
  </header>

  <main>
    ${dataWithImages
        .map(
          (item) => `
        <section class="record">

          <div class="grid">

            <div>
              <h2>${item.categoria || item.tipoColeta}</h2>

              <p><strong>Pesquisador:</strong> ${item.pesquisador}</p>
              <p><strong>Tipo:</strong> ${item.tipoColeta}</p>
              <p><strong>Local:</strong> ${item.local}</p>
              <p><strong>Data/Hora:</strong> ${item.data} - ${item.hora}</p>
              <p><strong>Latitude:</strong> ${item.latitude ?? "-"}</p>
              <p><strong>Longitude:</strong> ${item.longitude ?? "-"}</p>
${Object.entries(item.respostas || {})
              .map(([key, value]) => {
                const formattedValue =
                  value === null || value === undefined || value === ""
                    ? "Não informado"
                    : Array.isArray(value)
                      ? value.join(", ")
                      : String(value);

                return `
      <p>
        <strong>${key.replace(/_/g, " ")}:</strong> ${formattedValue}
      </p>
    `;
              })
              .join("")}       
                   </div>

            <div>
              ${item.fotoBase64
              ? `<img class="photo" src="${item.fotoBase64}" />`
              : `<div class="muted">Sem foto</div>`
            }
            </div>

          </div>

        </section>
      `
        )
        .join("")}
  </main>

  <footer>
    Observatório de Transporte de Minas Gerais — Relatório offline gerado automaticamente
  </footer>

</body>
</html>
`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };
  const clearAll = async () => {
    if (data.length === 0) {
      Alert.alert("Aviso", "Não há dados para excluir");
      return;
    }
    const saved = await AsyncStorage.getItem("collections");
    const previousData = saved ? JSON.parse(saved) : [];

    Alert.alert("Confirmação", "Deseja apagar todas as coletas?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("collections");
          setData([]);

          // ALERT de DESFAZER
          Alert.alert(
            "Apagado",
            "As coletas foram removidas.",
            [
              {
                text: "Desfazer",
                onPress: async () => {
                  await AsyncStorage.setItem(
                    "collections",
                    JSON.stringify(previousData)
                  );
                  setData(previousData);
                },
              },
              { text: "Ok" },
            ]
          );
        },
      },
    ]);
  };
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [])
  );
  const loadCollections = async () => {
    const collections = await AsyncStorage.getItem("collections");
    setData(collections ? JSON.parse(collections) : []);
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

        <Text style={styles.title}>Coletas realizadas</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={exportCSV}>
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={exportPDF}>
          <Ionicons name="document-text-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={clearAll}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Apagar tudo</Text>
        </TouchableOpacity>
      </View>
      {/* LISTA */}
      <FlatList
        data={data}
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
              <Ionicons
                name="document-text-outline"
                size={26}
                color={colors.primary}
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
      />
    </View>
  );
}
const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 10,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.medium,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },

  deleteButton: {
    backgroundColor: "#d9534f",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingBottom: 40,
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
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EAF7F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
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
});