import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../auth/supabaseClient";
import Modal from "../components/ui/Modal";
import AvatarCropper, { type AvatarCropState } from "../components/ui/AvatarCropper";

type FormState = { first_name: string; last_name: string; institution: string };

const WelcomePage: React.FC = () => {
    // User & profile states :
    const { user, hasProfile, createProfile } = useAuth();
    const [params] = useSearchParams();
    const navigate = useNavigate();

    // Avatar states:
    const [showCropper, setShowCropper] = useState(false);
    const [rawAvatarFile, setRawAvatarFile] = useState<File | null>(null); // original image
    const [avatarFile, setAvatarFile] = useState<File | null>(null); // cropped image
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cropState, setCropState] = useState<AvatarCropState | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states:
    const [form, setForm] = useState<FormState>({
        first_name: "",
        last_name: "",
        institution: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate("/signin", { replace: true });
            return;
        }
        if (hasProfile) {
            navigate(params.get("redirect") || "/", { replace: true });
            return;
        }
        const meta: Record<string, unknown> = user.user_metadata ?? {};
        const full =
            typeof meta.full_name === "string"
                ? meta.full_name
                : typeof meta.name === "string"
                  ? meta.name
                  : typeof meta.user_name === "string"
                    ? meta.user_name
                    : "";
        const [f = "", l = ""] = full.split(" ");
        setForm((prev) => ({
            ...prev,
            first_name: prev.first_name || f,
            last_name: prev.last_name || l,
        }));
    }, [user, hasProfile, navigate, params]);

    // Build preview of the avatar whenever the cropped file changes
    useEffect(() => {
        if (!avatarFile) {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
            return;
        }
        // Create a blob URL for the cropped avatar file
        // This allows us to preview the image without uploading it yet
        // Note: this URL should be revoked when no longer needed (I THINK)
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    const canSubmit = useMemo(
        () => form.first_name.trim().length > 0 && form.last_name.trim().length > 0 && !submitting,
        [form, submitting]
    );

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Always reset input so uploading the same file twice works
        e.currentTarget.value = "";
        if (!file) return;

        const okType = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
        const okSize = file.size <= 5 * 1024 * 1024; // 5MB
        if (!okType) return setError("Please choose a PNG, JPG, or WEBP image.");
        if (!okSize) return setError("Avatar must be 5MB or smaller.");

        setError(null);
        setRawAvatarFile(file);
        // New upload: clear old crop so user starts fresh (or keep if you prefer)
        setCropState(null);
        setShowCropper(true); // open cropper modal immediately
    };

    // Save from cropper
    const handleCropped = (blob: Blob, state: AvatarCropState) => {
        // Persist the crop state so "Edit" restores the same area
        setCropState(state);

        // Wrap blob as a File for uploading
        const baseName = (rawAvatarFile?.name || "avatar").replace(/\.[^.]+$/, "");
        const croppedFile = new File([blob], `${baseName}.png`, { type: "image/png" });

        setAvatarFile(croppedFile);
        setShowCropper(false);
    };

    // I ran into the case when the user wants to edit the avatar; we can't just
    // save the edited avatar directly because we need the original file for cropping.
    // So we store the original file separately and use it when the user clicks "Edit".
    const onEditAvatar = () => {
        if (!rawAvatarFile) return; // must have an original to re-crop
        setShowCropper(true);
    };

    // Remove no longer needs references that break uploading
    const onRemoveAvatar = () => {
        setAvatarFile(null);
        setRawAvatarFile(null);
        setCropState(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const uploadAvatarIfAny = async (): Promise<string | null> => {
        if (!avatarFile || !user) return null;
        const ext = (avatarFile.name.split(".").pop() || "png").toLowerCase();
        const key = `users/${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("user_pfps").upload(key, avatarFile, {
            cacheControl: "3600",
            upsert: true,
            contentType: avatarFile.type || "image/png",
        });
        if (upErr) {
            throw upErr;
        }
        return key;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);

        try {
            let pfp_path: string | null = null;
            if (avatarFile) {
                try {
                    pfp_path = await uploadAvatarIfAny();
                } catch (uploadErr: unknown) {
                    setError(
                        uploadErr instanceof Error
                            ? uploadErr.message
                            : "Avatar upload failed. Please try another image."
                    );
                    setSubmitting(false);
                    return;
                }
            }

            await createProfile({
                first_name: form.first_name,
                last_name: form.last_name,
                institution: form.institution || null,
                pfp_path,
                settings: {},
            });

            navigate(params.get("redirect") || "/", { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-inter font-medium text-gray-900 mb-3">
                        Set up your profile
                    </h1>
                    <p className="text-gray-600">
                        Tell us a bit about you. You can change these later in Settings.
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={onSubmit} className="space-y-6" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile picture (optional)
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs text-gray-400">No image</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={onPickAvatar}
                                            className="hidden"
                                        />
                                        Upload image
                                    </label>

                                    {avatarPreview && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={onEditAvatar}
                                                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onRemoveAvatar}
                                                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        PNG/JPG/WEBP, up to 5MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={form.first_name}
                                onChange={onChange}
                                placeholder="Ada"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={form.last_name}
                                onChange={onChange}
                                placeholder="Lovelace"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Institution (optional)
                            </label>
                            <input
                                type="text"
                                name="institution"
                                value={form.institution}
                                onChange={onChange}
                                placeholder="University / Company"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600" role="alert" aria-live="polite">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full bg-viix-green text-white py-3 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? "Saving…" : "Continue"}
                        </button>
                    </form>
                </div>
            </div>

            {showCropper && rawAvatarFile && (
                <Modal onClose={() => setShowCropper(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-[90vw] max-w-lg">
                        <AvatarCropper
                            file={rawAvatarFile}
                            initialCrop={cropState?.crop}
                            initialZoom={cropState?.zoom}
                            onCancel={() => setShowCropper(false)}
                            onSave={handleCropped}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default WelcomePage;
