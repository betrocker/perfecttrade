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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Improved session check sa timeout
  const checkSession = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Session check timeout")), 5000)
      );

      const sessionPromise = supabase.auth.getSession();

      const {
        data: { session },
      } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.log("Session check failed, assuming logged out:", error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Re-check session when app comes to foreground
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkSession();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      appStateListener.remove();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Prevent email confirmation redirect issues
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

      // Manually set state to avoid race condition
      setSession(data.session);
      setUser(data.user);
    } catch (error: any) {
      // Retry on network errors
      if (retries > 0 && error.message?.includes("Network request failed")) {
        console.log(`Network error, retrying... (${retries} attempts left)`);
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
  };

  return (
    <AuthContext.Provider
      value={{ user, session, signUp, signIn, signOut, loading }}
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
