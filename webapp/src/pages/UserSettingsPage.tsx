import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../auth/supabaseClient";

const UserSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { profile, updateProfile, user, session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Debug logging
    console.log('UserSettingsPage render:', { user, profile, session });
    
    // Form state
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        institution: "",
        email: ""
    });
    
    // Profile picture state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Initialize form data when profile loads
    useEffect(() => {
        console.log('Profile or user changed:', { profile, user, session });
        if (profile) {
            setFormData({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                institution: profile.institution || "",
                email: user?.email || session?.user?.email || ""
            });
        }
    }, [profile, user, session]);

    // Load avatar URL
    useEffect(() => {
        if (profile?.pfp_path) {
            if (/^https?:\/\//i.test(profile.pfp_path)) {
                setAvatarUrl(profile.pfp_path);
            } else {
                supabase.storage
                    .from("user_pfps")
                    .createSignedUrl(profile.pfp_path, 60 * 60)
                    .then(({ data, error }) => {
                        if (!error && data?.signedUrl) {
                            setAvatarUrl(data.signedUrl);
                        } else {
                            const pub = supabase.storage.from("user_pfps").getPublicUrl(profile.pfp_path!);
                            setAvatarUrl(pub.data.publicUrl || null);
                        }
                    });
            }
        }
    }, [profile?.pfp_path]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setMessage(null);
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size must be less than 5MB');
            }

            // Use the same file path structure as WelcomePage
            const ext = (file.name.split('.').pop() || 'png').toLowerCase();
            const key = `users/${profile?.user_id}/avatar-${Date.now()}.${ext}`;
            
            console.log('Uploading to key:', key);

            const { error: uploadError } = await supabase.storage
                .from("user_pfps")
                .upload(key, file, {
                    cacheControl: "3600",
                    upsert: true,
                    contentType: file.type || "image/png",
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            console.log('File uploaded successfully, updating profile...');

            // Update profile with new avatar path
            await updateProfile({ pfp_path: key });
            setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
            
            // Refresh the avatar URL
            setAvatarUrl(supabase.storage.from("user_pfps").getPublicUrl(key).data.publicUrl);
            
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setMessage({ 
                type: 'error', 
                text: error instanceof Error ? error.message : 'Failed to upload profile picture' 
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        try {
            setLoading(true);
            setMessage(null);

            await updateProfile({
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                institution: formData.institution.trim() || null,
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f57920] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                    <p className="text-sm text-gray-500 mt-2">User: {user?.email || 'Not loaded'}</p>
                    <p className="text-sm text-gray-500">Profile: {profile ? 'Loaded' : 'Not loaded'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/")}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                                <span className="material-icons-outlined text-2xl">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">User Settings</h1>
                                <p className="text-gray-600">Manage your profile and preferences</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {/* Profile Picture Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img
                                    src={avatarUrl || "/default-avatar.jpg"}
                                    alt="Profile"
                                    className="h-24 w-24 rounded-full border-4 border-gray-200 object-cover"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#f57920] text-white rounded-lg hover:bg-[#e6651b] transition-all duration-200">
                                    <span className="material-icons-outlined">upload</span>
                                    {uploading ? 'Uploading...' : 'Change Picture'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>


                            </div>
                        </div>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${
                            message.type === 'success' 
                                ? 'bg-green-50 text-green-800 border border-green-200' 
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f57920] focus:border-transparent"
                                    placeholder="Enter your first name"
                                />
                            </div>

                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f57920] focus:border-transparent"
                                    placeholder="Enter your last name"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                                Institution
                            </label>
                            <input
                                type="text"
                                id="institution"
                                name="institution"
                                value={formData.institution}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f57920] focus:border-transparent"
                                placeholder="Enter your institution or organization"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={user?.email || session?.user?.email || "Loading..."}
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                placeholder="Email address"
                            />

                            {!user?.email && !session?.user?.email && (
                                <p className="text-sm text-amber-600 mt-1">
                                    Email loading... Please wait for authentication to complete.
                                </p>
                            )}

                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-[#f57920] text-white rounded-lg hover:bg-[#e6651b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-lg">save</span>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default UserSettingsPage;
