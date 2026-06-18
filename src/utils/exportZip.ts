import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { Alert } from "react-native";

const photoPathName = (
  latitude: any,
  longitude: any,
  date: any,
  hour: any
) => {
  return `${String(latitude ?? "0")
    .replace(".", "")
    .replace("-", "_")}_${String(longitude ?? "0")
    .replace(".", "")
    .replace("-", "_")}_${`${String(date ?? "0")}_${hour ?? "0"}`
    .replace(/\//g, "")
    .replace(/:/g, "")
    .replace(/\s/g, "")}`;
};

export const exportZIP = async (data: any[]) => {
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
      ...camposRespostas,
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
      photoPathName(
        item.latitude,
        item.longitude,
        item.data,
        item.hora
      ),
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
        row
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    zip.file("registros.csv", csvContent);

    for (const item of fotos) {
      const extensao =
        item.foto.split(".").pop()?.split("?")[0] || "jpg";

      const nomeArquivo =
        photoPathName(
          item.latitude,
          item.longitude,
          item.data,
          item.hora
        ) + `.${extensao}`;

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

    const zipInfo = await FileSystem.getInfoAsync(
      zipPath
    );

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

    Alert.alert(
      "Exportar ZIP",
      "O que deseja fazer?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Compartilhar",
          onPress: async () => {
            try {
              const available =
                await Sharing.isAvailableAsync();

              if (!available) {
                Alert.alert(
                  "Aviso",
                  "Compartilhamento não disponível neste dispositivo."
                );
                return;
              }

              await Sharing.shareAsync(zipPath, {
                mimeType: "application/zip",
                dialogTitle: "Compartilhar ZIP",
              });
            } catch (error) {
              console.error(error);
              Alert.alert(
                "Erro",
                "Não foi possível compartilhar o ZIP."
              );
            }
          },
        },
        {
          text: "Baixar",
          onPress: async () => {
            try {
              const permissions =
                await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

              if (!permissions.granted) {
                Alert.alert(
                  "Aviso",
                  "Permissão para salvar o arquivo foi negada."
                );
                return;
              }

              const fileUri =
                await FileSystem.StorageAccessFramework.createFileAsync(
                  permissions.directoryUri,
                  "coletas",
                  "application/zip"
                );

              const zipContent =
                await FileSystem.readAsStringAsync(
                  zipPath,
                  {
                    encoding:
                      FileSystem.EncodingType.Base64,
                  }
                );

              await FileSystem.StorageAccessFramework.writeAsStringAsync(
                fileUri,
                zipContent,
                {
                  encoding:
                    FileSystem.EncodingType.Base64,
                }
              );

              Alert.alert(
                "Sucesso",
                "Arquivo ZIP salvo com sucesso."
              );
            } catch (error) {
              console.error(error);
              Alert.alert(
                "Erro",
                "Não foi possível salvar o ZIP."
              );
            }
          },
        },
      ]
    );
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