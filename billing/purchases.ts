import Purchases from "react-native-purchases";

const ENTITLEMENT_ID = "premium";

export async function initPurchases() {
  // RevenueCat public SDK key (Google) iz Dashboard-a
  await Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
  });
}

export async function getIsPremium(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}
