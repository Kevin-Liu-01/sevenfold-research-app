// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import supabase from "../auth/supabaseClient";

import type { UserProfile } from "../../../schema/db-types";
import { clearUserPersistentState } from "../hooks/clearUserPersistentState";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;

    profile: UserProfile | null;
    hasProfile: boolean;
    profileLoading: boolean;
    refreshProfile: () => Promise<void>;
    createProfile: (data: {
        first_name: string;
        last_name: string;
        institution?: string | null;
        pfp_path?: string | null;
        settings?: Record<string, unknown> | null;
    }) => Promise<void>;

    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithProvider: (provider: "google" | "github") => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    async function loadProfile(u: User | null) {
        setProfileLoading(true);
        try {
            if (!u) {
                setProfile(null);
                return;
            }
            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("user_id", u.id)
                .maybeSingle(); // ok if returns null when no row
            if (error) {
                setProfile(null);
                return;
            }
            setProfile(data ?? null);
        } finally {
            setProfileLoading(false);
        }
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            void loadProfile(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            void loadProfile(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Expose helpers
    const refreshProfile = async () => {
        await loadProfile(user);
    };

    const createProfile = async (data: {
        first_name: string;
        last_name: string;
        institution?: string | null;
        pfp_path?: string | null;
        settings?: Record<string, unknown> | null;
    }) => {
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("user_profiles").insert({
            user_id: user.id,
            first_name: data.first_name.trim(),
            last_name: data.last_name.trim(),
            institution: data.institution ?? null,
            pfp_path: data.pfp_path ?? null,
            settings: data.settings ?? {},
        });

        // If another tab already created it, you might see a unique violation: ignore and refresh.
        await refreshProfile();
        if (error && error.code !== "23505") throw error;
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setProfile(null);
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Clear user-specific persistent state
        // to avoid leaking user data across sessions
        // ex. workbench state, selected papers
        if (user?.id) {
            clearUserPersistentState(user?.id);
        }
    };

    const signInWithProvider = async (provider: "google" | "github") => {
        const { error } = await supabase.auth.signInWithOAuth({ provider });
        if (error) throw error;
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/forgot-password`,
        });
        if (error) throw error;
    };

    const value: AuthContextType = {
        user,
        session,
        loading,
        profile,
        hasProfile: !!profile,
        profileLoading,
        refreshProfile,
        createProfile,
        signIn,
        signUp,
        signOut,
        signInWithProvider,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
