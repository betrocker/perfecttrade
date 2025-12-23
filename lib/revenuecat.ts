import Purchases, { CustomerInfo } from "react-native-purchases";

const ENTITLEMENT_ID = "premium";
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initRevenueCat() {
  // Sprečava višestruku inicijalizaciju
  if (isInitialized) {
    console.log("✅ RevenueCat already initialized");
    return;
  }

  // Ako je inicijalizacija u toku, čekaj da se završi
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
      });
      isInitialized = true;
      console.log("✅ RevenueCat initialized");
    } catch (error) {
      console.error("❌ RevenueCat init error:", error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

let isLoggingIn = false;
let currentUserId: string | null = null;

export async function revenueCatLogin(supabaseUserId: string) {
  // Spreči duplicirane login pozive
  if (currentUserId === supabaseUserId) {
    console.log("✅ Already logged in as", supabaseUserId);
    return;
  }

  if (isLoggingIn) {
    console.log("⏳ Login already in progress");
    return;
  }

  try {
    isLoggingIn = true;
    await Purchases.logIn(supabaseUserId);
    currentUserId = supabaseUserId;
    console.log("✅ RevenueCat logged in:", supabaseUserId);
  } catch (error: any) {
    // Ignoriši concurrent request error
    if (error.code === 16 && error.info?.backendErrorCode === 7638) {
      console.log("⚠️ Concurrent login blocked (normal behavior)");
      currentUserId = supabaseUserId;
      return;
    }
    console.error("❌ RevenueCat login error:", error);
    throw error;
  } finally {
    isLoggingIn = false;
  }
}

export async function revenueCatLogout() {
  try {
    await Purchases.logOut();
    currentUserId = null;
    console.log("✅ RevenueCat logged out");
  } catch (error) {
    console.error("❌ RevenueCat logout error:", error);
  }
}

export function isPremiumFromInfo(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

export async function getIsPremium(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return isPremiumFromInfo(info);
  } catch (error) {
    console.error("❌ Error getting premium status:", error);
    return false;
  }
}
