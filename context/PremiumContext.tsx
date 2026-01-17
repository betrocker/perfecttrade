import {
  initRevenueCat,
  isPremiumFromInfo,
  revenueCatLogin,
  revenueCatLogout,
} from "@/lib/revenuecat";
import { supabase } from "@/lib/supabase";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const hasInitialized = useRef(false);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1. Inicijalizuj RevenueCat SAMO JEDNOM
        if (!hasInitialized.current) {
          await initRevenueCat();
          hasInitialized.current = true;
        }

        // 2. Proveri trenutnu sesiju
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          await revenueCatLogin(session.user.id);
        }

        // 3. Preuzmi premium status
        const info = await Purchases.getCustomerInfo();
        if (mounted) {
          setIsPremium(isPremiumFromInfo(info));
        }

        // 4. Slušaj promene customer info
        listenerRef.current = Purchases.addCustomerInfoUpdateListener(
          (info: CustomerInfo) => {
            if (mounted) {
              setIsPremium(isPremiumFromInfo(info));
            }
          }
        );
      } catch (error) {
        console.error("❌ PremiumProvider init error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // 5. Slušaj auth promene (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (event === "SIGNED_IN" && session?.user?.id) {
          await revenueCatLogin(session.user.id);
          const info = await Purchases.getCustomerInfo();
          setIsPremium(isPremiumFromInfo(info));
        } else if (event === "SIGNED_OUT") {
          await revenueCatLogout();
          setIsPremium(false);
        }
      } catch (error) {
        console.error("❌ Auth change error:", error);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (listenerRef.current) {
        listenerRef.current.remove();
      }
    };
  }, []); // Prazan dependency array - pokreni samo jednom!

  const refresh = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setIsPremium(isPremiumFromInfo(info));
    } catch (error) {
      console.error("❌ Refresh error:", error);
    }
  };

  const purchase = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) throw new Error("No current offering configured");

      const pkg = current.availablePackages[0];
      if (!pkg) throw new Error("No packages available");

      const res = await Purchases.purchasePackage(pkg);
      setIsPremium(isPremiumFromInfo(res.customerInfo));
    } catch (error: any) {
      if (error.userCancelled) {
        // NE throw-uj error ako je korisnik otkazao
        return; // ili throw error da UI zna
      }

      console.error("❌ Purchase error:", error);
      throw error; // Throw samo prave errore
    }
  };

  const restore = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setIsPremium(isPremiumFromInfo(info));
    } catch (error) {
      console.error("❌ Restore error:", error);
      throw error;
    }
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
