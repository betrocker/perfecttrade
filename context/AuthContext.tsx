import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshSession: () => Promise<void>; // ← DODAJ
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Session check with timeout
  const checkSession = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Session check timeout")), 5000),
      );

      const sessionPromise = supabase.auth.getSession();

      const {
        data: { session },
        error,
      } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

      if (error) {
        console.error("❌ Session check error:", error);
        setSession(null);
        setUser(null);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error("❌ Session check failed:", error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ← NOVA FUNKCIJA: Manual session refresh
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("❌ Session refresh error:", error);
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log("✅ Session refreshed successfully");
      }
    } catch (error) {
      console.error("❌ Session refresh failed:", error);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth event:", event);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Auto-refresh on TOKEN_REFRESHED event
      if (event === "TOKEN_REFRESHED") {
        console.log("✅ Token auto-refreshed");
      }

      // Sign out if session expired
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }
    });

    // Re-check session when app comes to foreground
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          console.log("📱 App became active, checking session...");
          checkSession();
        }
      },
    );

    // Auto-refresh session every 30 minutes (preventive)
    const refreshInterval = setInterval(
      () => {
        console.log("⏰ Auto-refreshing session...");
        refreshSession();
      },
      30 * 60 * 1000,
    ); // 30 minutes

    return () => {
      subscription.unsubscribe();
      appStateListener.remove();
      clearInterval(refreshInterval);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string, retries = 2) => {
    try {
      // Clear any stale session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Manually set state
      setSession(data.session);
      setUser(data.user);

      console.log("✅ Sign in successful");
    } catch (error: any) {
      // Retry on network errors
      if (retries > 0 && error.message?.includes("Network request failed")) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return signIn(email, password, retries - 1);
      }
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Force clear state
    setSession(null);
    setUser(null);

    console.log("✅ Signed out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signUp,
        signIn,
        signOut,
        loading,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
