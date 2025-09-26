import { useWorkbench, ViewType } from "../context/WorkbenchContext";
import type { ChatConvo } from "../../../schema/db-types";

const NewChatButton: React.FC<{
    onClick: () => void;
}> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center space-x-1 bg-kets-orange text-white text-sm font-medium px-2 py-1 rounded-md transition"
        >
            <span className="material-icons text-base">chat</span>
            <span>New Chat</span>
        </button>
    );
};

const ChatConvoBox: React.FC<{
    convo: ChatConvo;
    isSelected: boolean;
    onClick: () => void;
}> = ({ convo, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-2 bg-app-inner rounded-md cursor-pointer transition
                ${isSelected ? "bg-gray-150 shadow" : "hover:bg-gray-300"}
            `}
        >
            <div className="flex items-center space-x-1">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                        {convo.name || "Untitled"}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ChatConvosList: React.FC<{
    convos: ChatConvo[];
    selectedConvo: ChatConvo | null;
    onSelectConvo: (convo: ChatConvo) => void;
}> = ({ convos, selectedConvo, onSelectConvo }) => {
    if (!convos || convos.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-4">No conversations found</div>;
    } else {
        return (
            <div className="flex flex-col space-y-2">
                {convos.map((convo) => (
                    <ChatConvoBox
                        key={convo.id}
                        convo={convo}
                        isSelected={selectedConvo?.id === convo.id}
                        onClick={() => onSelectConvo(convo)}
                    />
                ))}
            </div>
        );
    }
};

const ChatPanel: React.FC = () => {
    const { convos, selectedConvo, setSelectedConvo, setCurrentView } = useWorkbench();

    // Handle conversation selection
    const handleSelectConvo = (convo: ChatConvo) => {
        setSelectedConvo(convo);
        setCurrentView(ViewType.Chat);
    };

    // Handle new chat creation
    const handleNewChat = () => {
        setSelectedConvo(null);
        setCurrentView(ViewType.Chat);
    };

    return (
        <div className="flex flex-col space-y-3">
            <h1 className="text-lg font-semibold">Conversations</h1>
            <NewChatButton onClick={handleNewChat} />
            <ChatConvosList
                convos={convos}
                selectedConvo={selectedConvo}
                onSelectConvo={handleSelectConvo}
            />
        </div>
    );
};

export default ChatPanel;
