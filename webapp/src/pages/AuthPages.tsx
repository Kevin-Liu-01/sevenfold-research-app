// src/pages/AuthPages.tsx

import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Github } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const rawMarketingUrl = import.meta.env.VITE_MARKETING_URL?.trim();
const marketingBaseUrl = rawMarketingUrl.replace(/\/$/, "");

const AuthHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
    <div className="text-center">
        <h1 className="text-4xl font-inter font-medium text-gray-900 dark:text-gray-100 mb-3">
            {title}
        </h1>
        {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
);

const AuthDivider: React.FC = () => (
    <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                or
            </span>
        </div>
    </div>
);

const AuthFooter: React.FC = () => (
    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        By continuing, you agree to Sevenfold's{" "}
        <a
            href={`${marketingBaseUrl}/terms`}
            className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
            Terms of Service
        </a>{" "}
        and{" "}
        <a
            href={`${marketingBaseUrl}/privacy`}
            className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
            Privacy Policy
        </a>
        , and to receive periodic emails with updates.
    </div>
);

const InputField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder: string;
    type?: string;
}> = ({ id, label, value, onChange, placeholder, type = "text" }) => (
    <div>
        <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
            {label}
        </label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
    </div>
);

const PasswordField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder: string;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ id, label, value, onChange, placeholder, showPassword, setShowPassword }) => (
    <div>
        <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
            {label}
        </label>
        <div className="relative">
            <input
                id={id}
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
                {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
            </button>
        </div>
    </div>
);

const OAuthButton: React.FC<{
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
}> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
        {icon && <span className="mr-3">{icon}</span>}
        {label}
    </button>
);

export const SigninPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { signIn, signInWithProvider } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await signIn(email, password);
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Error signing in");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                <AuthHeader title="Welcome Back" description="Sign in to your account" />

                {successMessage && (
                    <div className="text-green-700 dark:text-green-300 text-sm bg-green-100 dark:bg-green-900/50 p-3 rounded-md border border-green-300 dark:border-green-700">
                        {successMessage}
                    </div>
                )}

                <div className="space-y-4">
                    <OAuthButton
                        icon={<Github className="w-5 h-5" />}
                        label="Continue with GitHub"
                        onClick={() => signInWithProvider("github")}
                    />
                    <OAuthButton
                        icon={
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                G
                            </div>
                        }
                        label="Continue with Google"
                        onClick={() => signInWithProvider("google")}
                    />
                    <AuthDivider />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        id="email"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Password
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <PasswordField
                            id="password"
                            label=""
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                        />
                    </div>

                    {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-kets-green text-white py-3 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link
                        to="/signup"
                        className="text-black dark:text-white hover:underline font-medium"
                    >
                        Sign Up Now
                    </Link>
                </p>

                <AuthFooter />
            </div>
        </div>
    );
};

export const SignupPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { signUp, signInWithProvider } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            await signUp(email, password);
            navigate("/signin", {
                state: {
                    message: "Please check your email to verify your account",
                },
            });
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                <AuthHeader title="Get Started" description="Create a new account" />

                <div className="space-y-4">
                    <OAuthButton
                        icon={<Github className="w-5 h-5" />}
                        label="Continue with GitHub"
                        onClick={() => signInWithProvider("github")}
                    />

                    <OAuthButton
                        icon={
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                G
                            </div>
                        }
                        label="Continue with Google"
                        onClick={() => signInWithProvider("google")}
                    />

                    <AuthDivider />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        <InputField
                            id="signup-email"
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                        <PasswordField
                            id="signup-password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                        />
                        <PasswordField
                            id="signup-confirm"
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                        />

                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-kets-green text-white py-3 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 dark:text-gray-400">
                        Have an account?{" "}
                        <Link
                            to="/signin"
                            className="text-black dark:text-white hover:underline font-medium"
                        >
                            Sign In Now
                        </Link>
                    </p>
                </div>

                <AuthFooter />
            </div>
        </div>
    );
};

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const { resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await resetPassword(email);
            setSent(true);
            navigate("/signin");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full space-y-4 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Check your email
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        We’ve sent a password reset link to{" "}
                        <span className="font-medium">{email}</span>. Please follow the instructions
                        in the email to reset your password.
                    </p>
                    <Link
                        to="/signin"
                        className="inline-block mt-4 text-green-600 dark:text-green-400 hover:underline font-medium"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                <AuthHeader
                    title="Reset Your Password"
                    description="Enter your email address and we'll send you a reset link"
                />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        id="reset-email"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        type="email"
                    />

                    {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-kets-green text-white py-3 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Sending reset link..." : "Send reset link"}
                    </button>
                </form>

                <div className="text-center">
                    <Link
                        to="/signin"
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};
