import Purchases, { CustomerInfo } from "react-native-purchases";

const ENTITLEMENT_ID = "premium";
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

export async function initRevenueCat(): Promise<boolean> {
  // Sprečava višestruku inicijalizaciju
  if (isInitialized) {
    return true;
  }

  // Ako je inicijalizacija u toku, čekaj da se završi
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

      // Proveri da li postoji API key
      if (!apiKey) {
        console.warn(
          "⚠️ RevenueCat API key not found - premium features disabled",
        );
        return false;
      }

      await Purchases.configure({ apiKey });
      isInitialized = true;
      console.log("✅ RevenueCat initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ RevenueCat init error:", error);
      initPromise = null;
      isInitialized = false;
      return false;
    }
  })();

  return initPromise;
}

let isLoggingIn = false;
let currentUserId: string | null = null;

export async function revenueCatLogin(supabaseUserId: string) {
  if (!isInitialized) {
    console.warn("⚠️ RevenueCat not initialized, skipping login");
    return;
  }

  if (currentUserId === supabaseUserId) {
    return;
  }

  if (isLoggingIn) {
    return;
  }

  try {
    isLoggingIn = true;
    await Purchases.logIn(supabaseUserId);
    currentUserId = supabaseUserId;
    console.log("✅ RevenueCat login successful");
  } catch (error: any) {
    if (error.code === 16 && error.info?.backendErrorCode === 7638) {
      currentUserId = supabaseUserId;
      return;
    }
    console.error("❌ RevenueCat login error:", error);
  } finally {
    isLoggingIn = false;
  }
}

export async function revenueCatLogout() {
  if (!isInitialized) {
    console.warn("⚠️ RevenueCat not initialized, skipping logout");
    return;
  }

  try {
    await Purchases.logOut();
    currentUserId = null;
    console.log("✅ RevenueCat logout successful");
  } catch (error) {
    console.error("❌ RevenueCat logout error:", error);
  }
}

export function isPremiumFromInfo(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

export async function getIsPremium(): Promise<boolean> {
  if (!isInitialized) {
    console.warn("⚠️ RevenueCat not initialized, returning false");
    return false;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    return isPremiumFromInfo(info);
  } catch (error) {
    console.error("❌ Error getting premium status:", error);
    return false;
  }
}
