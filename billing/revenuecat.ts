import Purchases, { CustomerInfo } from "react-native-purchases";

const ENTITLEMENT_ID = "premium";

export async function initRevenueCat() {
  await Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
  }); // native init [web:49]
}

export async function revenueCatLogin(supabaseUserId: string) {
  // mapiraj RevenueCat user na Supabase user.id
  await Purchases.logIn(supabaseUserId); // [web:69]
}

export async function revenueCatLogout() {
  await Purchases.logOut(); // [web:69]
}

export function isPremiumFromInfo(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] != null; // [web:69]
}

export async function getIsPremium(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo(); // [web:69]
  return isPremiumFromInfo(info);
}
