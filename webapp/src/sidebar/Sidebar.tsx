// src/components/sidebar/Sidebar.tsx
import React, { useState, useRef, useEffect } from "react";
import supabase from "../auth/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkbench, ViewType } from "../context/WorkbenchContext";
import SidebarButton from "./SidebarButton";
import FeedbackPopup from "./FeedbackPopup";
import Modal from "../components/ui/Modal";

const navItems = [
    { view: ViewType.Search, label: "Search", icon: "search" },
    { view: ViewType.Chat, label: "Chat", icon: "3p" },
    { view: ViewType.Library, label: "Library", icon: "source" },
    { view: ViewType.Compose, label: "Compose", icon: "edit" },
    { view: ViewType.Settings, label: "Settings", icon: "settings" },
];

const HomeButton: React.FC = () => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate("/")}
            className="hover:opacity-80 transition-opacity duration-200 focus:outline-none mb-12"
            title="Go back to Home"
        >
            <img src="/branding/logo-sq.png" alt="Logo" className="h-13 w-13" />
        </button>
    );
};

const AvatarButton: React.FC = () => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const { projectId } = useWorkbench();
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const avatarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setAvatarMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Resolve storage path -> signed URL (or public URL) whenever pfp_path changes
    useEffect(() => {
        let cancelled = false;

        async function resolveAvatar() {
            const p = profile?.pfp_path;
            if (!p) {
                if (!cancelled) setAvatarUrl(null);
                return;
            }
            if (/^https?:\/\//i.test(p)) {
                if (!cancelled) setAvatarUrl(p);
                return;
            }
            const { data, error } = await supabase.storage
                .from("user_pfps")
                .createSignedUrl(p, 60 * 60); // 1 hour
            if (!cancelled) {
                if (!error && data?.signedUrl) {
                    setAvatarUrl(data.signedUrl);
                } else {
                    const pub = supabase.storage.from("user_pfps").getPublicUrl(p);
                    setAvatarUrl(pub.data.publicUrl || null);
                }
            }
        }

        resolveAvatar();
        return () => {
            cancelled = true;
        };
    }, [profile?.pfp_path]);

    return (
        <div ref={avatarRef} className="relative mt-6">
            <div
                onClick={() => setAvatarMenuOpen((o) => !o)}
                className="flex flex-col justify-center items-center pb-2"
            >
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-[50px] h-[50px] rounded-full border-2 border-viix-orange"></div>
                    <img
                        src={avatarUrl || "/default-avatar.jpg"}
                        alt={
                            `${profile?.first_name ?? "User"} ${profile?.last_name ?? ""}`.trim() ||
                            "Avatar"
                        }
                        className="h-11 w-11 rounded-full cursor-pointer transition-all duration-200 hover:shadow-md relative z-10"
                        onError={() => setAvatarUrl(null)}
                    />
                </div>
            </div>

            <div
                className={`absolute text-xs left-[calc(100%-0.5rem)] transform-gpu transition-all duration-200 ease-out ${
                    avatarMenuOpen
                        ? "translate-x-2 -translate-y-[100%] opacity-100 pointer-events-auto"
                        : "translate-x-0 -translate-y-[100%] opacity-0 pointer-events-none"
                } ml-2 w-max bg-app-inner border-2 border-gray-700 rounded-xl shadow-xl overflow-hidden z-40`}
            >
                {/* Account button commented out - non-functional
                <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => setAvatarMenuOpen(false)}
                >
                    Account
                </button>
                */}
                <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate("/settings", { state: { from: "project", projectId } });
                    }}
                >
                    Settings
                </button>
                <button
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                    onClick={() => {
                        setAvatarMenuOpen(false);
                        signOut();
                    }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
};

const FeedbackButton: React.FC = () => {
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    return (
        <div className="w-full flex flex-col items-center mt-6 mb-2">
            <button
                className="group flex flex-col items-center justify-center focus:outline-none"
                style={{ width: 48, height: 48 }}
                onClick={() => setFeedbackOpen(true)}
                title="Send Feedback"
            >
                <span className="material-icons-outlined transition-transform duration-200 text-base text-[var(--color-off-black)] group-hover:scale-[1.18]">
                    feedback
                </span>
                <span className="text-xs mt-0.5 transition-all duration-200 font-normal text-[var(--color-off-black)] group-hover:font-medium">
                    Feedback
                </span>
            </button>
            {feedbackOpen && (
                <Modal onClose={() => setFeedbackOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] max-w-full">
                        <FeedbackPopup onClose={() => setFeedbackOpen(false)} />
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default function Sidebar() {
    const { notification } = useWorkbench();

    return (
        <div className="flex flex-col space-between p-3 w-20 z-10 bg-app-outer">
            <HomeButton />
            <nav className="flex flex-1 flex-col justify-top space-y-6">
                {navItems.map((item) => (
                    <div key={item.view} className="relative flex justify-center">
                        <SidebarButton targetView={item.view} icon={item.icon} label={item.label} />
                        {item.view === ViewType.Library && notification && notification[0] && (
                            <div className="library-notification-bubble absolute left-full ml-2 top-1/2 z-20 bg-viix-orange-400 text-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center">
                                <span className="material-icons-outlined text-base mr-2">
                                    check_circle
                                </span>
                                <span className="text-xs font-medium">{notification}</span>
                            </div>
                        )}
                    </div>
                ))}
            </nav>
            <FeedbackButton />
            <AvatarButton />
        </div>
    );
}
