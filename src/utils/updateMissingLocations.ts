import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export
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