import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  Alert
} from "react-native";

const uriToBase64 = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

export
  const exportPDF = async (data: any, setLoadingPdf: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      setLoadingPdf(true)
      if (data.length === 0) {
        Alert.alert("Aviso", "Não há dados para gerar relatório");
        return;
      }

      const dataWithImages = await Promise.all(
        data.map(async (item: { foto: string; }) => ({
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

      Alert.alert(
        "Relatório BIANCA",
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
                    "Erro",
                    "Compartilhamento não disponível"
                  );
                  return;
                }

                await Sharing.shareAsync(pdfPath, {
                  mimeType: "application/pdf",
                  dialogTitle: "Relatório BIANCA",
                });
              } catch (error) {
                console.error(error);
                Alert.alert(
                  "Erro",
                  "Não foi possível compartilhar o PDF."
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

                const nomeArquivo =
                  `relatorio-bianca-${datePdf
                    .replace(/[:.]/g, "-")}.pdf`;

                const fileUri =
                  await FileSystem.StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    nomeArquivo.replace(".pdf", ""),
                    "application/pdf"
                  );

                const pdfContent =
                  await FileSystem.readAsStringAsync(
                    pdfPath,
                    {
                      encoding:
                        FileSystem.EncodingType.Base64,
                    }
                  );

                await FileSystem.StorageAccessFramework.writeAsStringAsync(
                  fileUri,
                  pdfContent,
                  {
                    encoding:
                      FileSystem.EncodingType.Base64,
                  }
                );

                Alert.alert(
                  "Sucesso",
                  "PDF salvo com sucesso."
                );
              } catch (error) {
                console.error(error);
                Alert.alert(
                  "Erro",
                  "Não foi possível salvar o PDF."
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", JSON.stringify(error));
    } finally {
      setLoadingPdf(false);
    }
  };
