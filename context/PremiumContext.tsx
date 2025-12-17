import { supabase } from "@/lib/supabase"; // prilagodi putanju ako je drugačija
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";

type PremiumContextValue = {
  loading: boolean;
  isPremium: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  refresh: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

const ENTITLEMENT_ID = "premium";

function isPremiumFromInfo(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    let mounted = true;

    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setLoading(true);

        const userId = session?.user?.id;
        if (userId) await Purchases.logIn(userId);
        else await Purchases.logOut();

        const info = await Purchases.getCustomerInfo();
        if (mounted) setIsPremium(isPremiumFromInfo(info));
      } finally {
        if (mounted) setLoading(false);
      }
    });

    (async () => {
      try {
        Purchases.configure({
          apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
        });

        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (userId) await Purchases.logIn(userId);

        const info = await Purchases.getCustomerInfo();
        if (mounted) setIsPremium(isPremiumFromInfo(info));

        Purchases.addCustomerInfoUpdateListener((info) => {
          if (!mounted) return;
          setIsPremium(isPremiumFromInfo(info));
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    const info = await Purchases.getCustomerInfo();
    setIsPremium(isPremiumFromInfo(info));
  };

  const purchase = async () => {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) throw new Error("No current offering configured");

    // ti u RevenueCat namesti da je prvi package annual+trial
    const pkg = current.availablePackages[0];
    if (!pkg) throw new Error("No packages available");

    const res = await Purchases.purchasePackage(pkg);
    setIsPremium(isPremiumFromInfo(res.customerInfo));
  };

  const restore = async () => {
    const info = await Purchases.restorePurchases();
    setIsPremium(isPremiumFromInfo(info));
  };

  const value = useMemo(
    () => ({ loading, isPremium, purchase, restore, refresh }),
    [loading, isPremium]
  );

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
