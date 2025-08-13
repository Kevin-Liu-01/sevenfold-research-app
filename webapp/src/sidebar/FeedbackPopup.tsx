import React, { useState } from "react";

interface FeedbackPopupProps {
    onClose: () => void;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ onClose }) => {
    const [email, setEmail] = useState("");
    const [description, setDescription] = useState("");
    const [sent, setSent] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => {
            onClose();
        }, 1200);
    };

    return (
        <div className="fixed left-20 bottom-8 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-5 w-80 flex flex-col items-start animate-fade-in">
            <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
                onClick={onClose}
                aria-label="Close"
            >
                ×
            </button>
            <div className="mb-2 w-full">
                <span className="font-semibold text-gray-800 text-base">Feedback</span>
            </div>
            <div className="mb-3 w-full text-xs text-gray-600">
                Join our Discord community:{" "}
                <a
                    href="https://discord.gg/kMK6kmYQCu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                >
                    discord.gg/kMK6kmYQCu
                </a>
            </div>
            {sent ? (
                <div className="text-green-600 text-sm font-medium">
                    Thank you for your feedback!
                </div>
            ) : (
                <form className="w-full flex flex-col gap-2" onSubmit={handleSend}>
                    <input
                        type="email"
                        placeholder="Your email (optional)"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <textarea
                        placeholder="Describe the bug or feedback..."
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs min-h-[60px] max-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        className="self-end px-4 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition"
                    >
                        Send
                    </button>
                </form>
            )}
        </div>
    );
};

export default FeedbackPopup;
