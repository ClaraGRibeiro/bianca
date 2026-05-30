import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RecordDetailsScreen from "../screens/RecordDetailsScreen";
import RecordsScreen from "../screens/RecordsScreen";
import RegisterScreen from "../screens/RegisterScreen";

export type RootStackParamList = {
  Home: undefined;
  Register: undefined;
  Records: undefined;
  RecordDetails: {
    item: any;
  };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="Register" component={RegisterScreen} />

      <Stack.Screen name="Records" component={RecordsScreen} />

      <Stack.Screen name="RecordDetails" component={RecordDetailsScreen} />

      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
