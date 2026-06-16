import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    Alert
} from "react-native";

export const clearAll = async (data: any, setData: React.Dispatch<React.SetStateAction<any[]>>) => {
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