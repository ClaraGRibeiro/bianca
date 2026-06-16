import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import React, { useCallback, useState } from "react";
import {
  Alert,
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
  const updateMissingLocations = async (collections: any[]) => {
    let updated = false;

    const newCollections = await Promise.all(
      collections.map(async (item) => {
        if (
          item.local !== "Sem Localização" ||
          !item.latitude ||
          !item.longitude
        ) {
          return item;
        }

        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
          });

          if (address.length > 0) {
            const addr = address[0];

            updated = true;

            return {
              ...item,
              local: [
                addr.name,
                addr.street,
                addr.streetNumber,
                addr.district,
                addr.subregion,
                addr.city,
                addr.region,
                addr.postalCode,
                addr.country,
              ]
                .filter(Boolean)
                .join(", "),
            };
          }
        } catch {
          // continua como está
        }

        return item;
      })
    );

    if (updated) {
      await AsyncStorage.setItem(
        "collections",
        JSON.stringify(newCollections)
      );
    }

    return newCollections;
  };
  const [visibleItems, setVisibleItems] = useState(5);
  const photoPathName = (latitude: any, longitude: any, date: any, hour: any) => {
    return `${String(latitude ?? "0").replace(".", "").replace("-", "_")}_${String(longitude ?? "0").replace(".", "").replace("-", "_")}_${`${String(date ?? "0")}_${hour ?? "0"}`.replace(/\//g, "").replace(/:/g, "").replace(/\s/g, "")}`
  }
  const exportZIP = async () => {
    try {
      const fotos = data.filter((item) => item.foto);

      if (fotos.length === 0) {
        Alert.alert("Aviso", "Não há dados para exportar");
        return;
      }

      const zip = new JSZip();
      const camposRespostas = Array.from(
        new Set(
          data.flatMap((item) =>
            Object.keys(item.respostas || {})
          )
        )
      );

      const header = [
        "id",
        "pesquisador",
        "tipoColeta",
        "local",
        "data",
        "hora",
        "latitude",
        "longitude",
        "imagem",
        ...camposRespostas
      ];

      const rows = data.map((item) => [
        item.id ?? "",
        item.pesquisador ?? "",
        item.tipoColeta ?? "",
        item.local ?? "",
        item.data ?? "",
        item.hora ?? "",
        item.latitude ?? "",
        item.longitude ?? "",
        photoPathName(item.latitude, item.longitude, item.data, item.hora),
        ...camposRespostas.map((campo) => {
          const valor = item.respostas?.[campo];

          if (Array.isArray(valor)) {
            return valor.join(" | ");
          }

          return valor ?? "";
        }),
      ]);

      const csvContent = [
        header.join(","),
        ...rows.map((row) =>
          row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      zip.file("registros.csv", csvContent);

      for (const item of fotos) {
        const extensao =
          item.foto.split(".").pop()?.split("?")[0] || "jpg";

        const nomeArquivo =
          photoPathName(item.latitude, item.longitude, item.data, item.hora) +
          `.${extensao}`;

        const base64 = await FileSystem.readAsStringAsync(
          item.foto,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );

        const imagensFolder = zip.folder("imagens");

        imagensFolder?.file(nomeArquivo, base64, {
          base64: true,
        });
      }

      const zipBase64 = await zip.generateAsync({
        type: "base64",
      });

      const zipPath =
        FileSystem.cacheDirectory + "coletas.zip";

      const zipInfo = await FileSystem.getInfoAsync(zipPath);

      if (zipInfo.exists) {
        await FileSystem.deleteAsync(zipPath, {
          idempotent: true,
        });
      }

      await FileSystem.writeAsStringAsync(
        zipPath,
        zipBase64,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );

      await Sharing.shareAsync(zipPath, {
        mimeType: "application/zip",
        dialogTitle: "Exportar imagens",
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Falha ao gerar ZIP"
      );
    }
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
    try {
      if (data.length === 0) {
        Alert.alert("Aviso", "Não há dados para gerar relatório");
        return;
      }

      const dataWithImages = await Promise.all(
        data.map(async (item) => ({
          ...item,
          fotoBase64: item.foto ? await uriToBase64(item.foto) : null,
        }))
      );

      const now = new Date();

      const datePdf =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}` +
        `_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;

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

    .muted {
      color: #64706d;
      font-size: 12px;
    }

    footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;

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

    .photo-wrapper {
      width: 55%;
      margin-left: auto;
    }

    .photo {
      width: 100%;
      display: block;
      border-radius: 8px 8px 0 0;
      border: 1px solid #d7dfdc;
      border-bottom: none;
    }
  </style>
</head>

<body>

  <header>
    <div class="brand">
      <h1>Relatório BIANCA</h1>
      <div class="subtitle">
        Base Integrada de Análise, Navegação, Coleta e Armazenamento </br>
        Gerado em ${datePdf} — Total: ${data.length} registros
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
              <h2>${item.tipoColeta}</h2>

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
                ? `
                  <div class="photo-wrapper">
                    <img class="photo" src="${item.fotoBase64}" />
                  </div>
                  `
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
  <div>
    Observatório de Transporte de Minas Gerais — Relatório offline gerado automaticamente
  </div>

  <div class="footer-logos">
    <img src="https://i.imgur.com/dJyKSJE.png" />
    <img src="https://i.imgur.com/P1k1tU4.png" />
    <img src="https://i.imgur.com/UDJEYIw.png" />
  </div>
</footer>

</body>
</html>
`;
      const { uri } = await Print.printToFileAsync({
        html,
      });

      const pdfPath =
        FileSystem.cacheDirectory +
        `relatorio-bianca-${datePdf
          .replace(/[:.]/g, "-")}.pdf`;

      await FileSystem.copyAsync({
        from: uri,
        to: pdfPath,
      });

      const available = await Sharing.isAvailableAsync();

      if (!available) {
        Alert.alert("Erro", "Compartilhamento não disponível");
        return;
      }

      await Sharing.shareAsync(pdfPath, {
        mimeType: "application/pdf",
        dialogTitle: "Relatório BIANCA",
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", JSON.stringify(error));
    }
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
    const saved = await AsyncStorage.getItem("collections");
    const collections = saved ? JSON.parse(saved) : [];
    const updatedCollections =
      await updateMissingLocations(collections);
    setData(updatedCollections);
    setVisibleItems(5);
  };

  const [ascending, setAscending] = useState(false);

  const sortDate = () => {
    const sorted = [...data].sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split("/");
      const [horaA, minutoA] = a.hora.split(":");

      const [diaB, mesB, anoB] = b.data.split("/");
      const [horaB, minutoB] = b.hora.split(":");

      const dateA = new Date(
        Number(anoA),
        Number(mesA) - 1,
        Number(diaA),
        Number(horaA),
        Number(minutoA)
      );

      const dateB = new Date(
        Number(anoB),
        Number(mesB) - 1,
        Number(diaB),
        Number(horaB),
        Number(minutoB)
      );

      return ascending
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    setData(sorted);
    setAscending(!ascending);
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

        <Text style={styles.title}>Coletas realizadas {data.length > 0 ? `[${data.length}]` : ""}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={exportZIP}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>ZIP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={exportPDF}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={clearAll}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Apagar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.sortLink}
        onPress={sortDate}
      >
        <Ionicons
          name="swap-vertical-outline"
          size={16}
          color={colors.primary}
        />
        <Text style={styles.sortText}>
          {ascending ? "Ordenado: mais recentes" : "Ordenado: mais antigos"}
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