import { useEffect } from "react";
import { supabase } from "./supabase";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export const signOut = async () => {
  await SecureStore.deleteItemAsync("userProfile");
  await supabase.auth.signOut();
  router.replace("/_loginRegister/loginRegister");
};

export function LogoutScreen() {
  useEffect(() => {
    signOut();
  }, []);

  return null;
}
