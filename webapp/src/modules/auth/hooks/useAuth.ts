import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/services/supabaseClient";
import { useAppStore } from "@/shared/state/appStore";

export function useAuth() {
  const { session, user, setSession, setUser } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return {
    session,
    user,
    isAuthenticated: !!session,
    signOut,
  };
}
