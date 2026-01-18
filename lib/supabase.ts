import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

console.log("=== SUPABASE CONFIG ===");
console.log("URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log("KEY exists:", !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log("KEY length:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length);
console.log("=====================");

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "x-client-info": "supabase-js-react-native",
    },
  },
  db: {
    schema: "public",
  },
  // Povećaj timeout
  realtime: {
    timeout: 10000,
  },
});
