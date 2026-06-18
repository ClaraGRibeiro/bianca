import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
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

export const downloadImage = async (item: any, setLoadingImage: React.Dispatch<React.SetStateAction<boolean>>) => {
  try {
    setLoadingImage(true)
    if (!item.foto) {
      Alert.alert("Aviso", "Esta coleta não possui imagem.");
      return;
    }

    const extensao =
      item.foto.split(".").pop()?.split("?")[0] || "jpg";

    const nomeArquivo =
      photoPathName(
        item.latitude,
        item.longitude,
        item.data,
        item.hora
      ) + `.${extensao}`;

    const destino = FileSystem.cacheDirectory + nomeArquivo;

    const info = await FileSystem.getInfoAsync(destino);

    if (info.exists) {
      await FileSystem.deleteAsync(destino, {
        idempotent: true,
      });
    }

    await FileSystem.copyAsync({
      from: item.foto,
      to: destino,
    });

    Alert.alert(
      "Imagem",
      "O que deseja fazer com esta imagem?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Compartilhar",
          onPress: async () => {
            try {
              const available = await Sharing.isAvailableAsync();

              if (!available) {
                Alert.alert(
                  "Aviso",
                  "Compartilhamento não disponível neste dispositivo."
                );
                return;
              }

              await Sharing.shareAsync(destino, {
                mimeType: `image/${extensao}`,
                dialogTitle: "Compartilhar imagem",
              });
            } catch (error) {
              console.error(error);
              Alert.alert(
                "Erro",
                "Não foi possível compartilhar a imagem."
              );
            }
          },
        },
        {
          text: "Baixar",
          onPress: async () => {
            try {
              const { status } =
                await MediaLibrary.requestPermissionsAsync();

              if (status !== "granted") {
                Alert.alert(
                  "Permissão necessária",
                  "É necessário permitir acesso às fotos para salvar a imagem."
                );
                return;
              }

              const asset =
                await MediaLibrary.createAssetAsync(destino);

              const album =
                await MediaLibrary.getAlbumAsync("BIANCA");

              if (!album) {
                await MediaLibrary.createAlbumAsync(
                  "BIANCA",
                  asset,
                  false
                );
              } else {
                await MediaLibrary.addAssetsToAlbumAsync(
                  [asset],
                  album,
                  false
                );
              }

              Alert.alert(
                "Sucesso",
                "Imagem salva no álbum BIANCA."
              );
            } catch (error) {
              console.error(error);
              Alert.alert(
                "Erro",
                "Não foi possível salvar a imagem."
              );
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error(error);
    Alert.alert("Erro", "Não foi possível processar a imagem.");
  } finally {
    setLoadingImage(false);
  }
};