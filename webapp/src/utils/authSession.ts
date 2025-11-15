import supabase from "../auth/supabaseClient";

export const getAuthSession = async () => {
    const {
        data: { session },
        error: authErr,
    } = await supabase.auth.getSession();

    if (authErr || !session?.access_token) {
        throw new Error("Not authenticated");
    }

    return session;
};
