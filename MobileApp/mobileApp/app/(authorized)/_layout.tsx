import React from "react";
import { View, StyleSheet } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import HomeScreen from "./index";
import AllJobScreen from "./jobListings";
import ProfileScreen from "./explore";
import Settings from "./settings";
import { signOut } from "../../lib/signOut";
import { useAppTheme } from "../../lib/ThemeProvider";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { colors } = useAppTheme();
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <View style={styles.bottomContainer}>
        <DrawerItem
          label="Exit"
          labelStyle={[styles.exitLabel, { color: colors.text }]}
          onPress={signOut}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { colors } = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTitleAlign: "center",
        drawerLabelStyle: {
          fontSize: 20,
          color: colors.text,
        },
        drawerActiveBackgroundColor: colors.drawerActiveBackgroundColor,
        drawerInactiveBackgroundColor: colors.drawerInactiveBackgroundColor,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Job listings" component={AllJobScreen} />
      <Drawer.Screen name="Chat" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={Settings} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  exitLabel: {
    fontSize: 25,
  },
});
