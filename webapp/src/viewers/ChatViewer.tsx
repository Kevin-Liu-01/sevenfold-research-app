import React, { useState, useRef, useEffect } from "react";
import { useWorkbench } from "../context/WorkbenchContext";

const ChatViewer: React.FC = () => {
  const { papers } = useWorkbench();
  const [inputValue, setInputValue] = useState("");
  const [responses, setResponses] = useState<
    {
      query: string;
      response: string;
      tab: "response" | "papers" | "images" | "other";
    }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responseHeight, setResponseHeight] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(
    papers.map((p) => p.id)
  );

  const responsesWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = responsesWrapperRef.current?.children[
      currentIndex
    ] as HTMLElement;
    if (el) {
      setResponseHeight(el.offsetHeight);
    }
  }, [currentIndex]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setLoading(true);
    setResponses((prev) => [
      ...prev,
      { query: trimmed, response: "Thinking...", tab: "response" },
    ]);
    setInputValue("");

    setTimeout(() => {
      setResponses((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].response =
          `This is a placeholder response using ${selectedPaperIds.length} paper(s).`;
        return updated;
      });

      if (responses.length > 0) {
        setCurrentIndex(responses.length);
      }

      setLoading(false);
    }, 500);
  };

  const togglePaperSelection = (id: string) => {
    setSelectedPaperIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Throttle scroll to once per 500ms
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = responsesWrapperRef.current?.parentElement?.parentElement;

    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (scrollTimeout.current) return;

      if (e.deltaY > 30) {
        setCurrentIndex((i) => Math.min(i + 1, responses.length - 1));
      } else if (e.deltaY < -30) {
        setCurrentIndex((i) => Math.max(i - 1, 0));
      }

      scrollTimeout.current = setTimeout(() => {
        scrollTimeout.current = null;
      }, 200); // throttle duration
    };

    container.addEventListener("wheel", handleWheel, { passive: true });

    return () => container.removeEventListener("wheel", handleWheel);
  }, [responses.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setCurrentIndex((i) => Math.min(i + 1, responses.length - 1));
      } else if (e.key === "ArrowUp") {
        setCurrentIndex((i) => Math.max(i - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [responses.length]);

  return (
    <div className="min-h-screen max-w-5xl mx-auto flex justify-center bg-white px-8 pt-10 pb-20">
      {responses.length === 0 && (
        <div className="flex flex-col w-full my-auto items-center text-center">
          <img
            src="/branding/logo-long.png"
            className="text-4xl h-12 font-bold text-gray-900 mb-6"
          />
          <div className="w-full max-w-3xl bg-gray-50 border border-orange-200 rounded-xl p-4 shadow-sm">
            <textarea
              placeholder="What are you researching today?"
              className="w-full resize-none bg-transparent text-lg text-gray-800 placeholder-gray-400 focus:outline-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={2}
            />
            <div className="flex justify-end gap-3 mt-3">
              <button className="text-gray-500 hover:text-orange-600">
                <span className="material-icons">attach_file</span>
              </button>
              <button className="text-gray-500 hover:text-orange-600">
                <span className="material-icons">mic</span>
              </button>
              <button className="text-gray-500 hover:text-orange-600">
                <span className="material-icons">smart_toy</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-left w-full max-w-3xl">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Ingested Papers
            </p>
            <div className="flex flex-wrap gap-2">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => togglePaperSelection(paper.id)}
                  className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition
                    ${
                      selectedPaperIds.includes(paper.id)
                        ? "bg-orange-100 border-orange-300 text-orange-800"
                        : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}
                >
                  {paper.filename || "Untitled"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {responses.length > 0 && (
        <>
          <div className="relative w-full h-[calc(100vh-12rem)] overflow-hidden">
            <div
              className="transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateY(-${currentIndex * responseHeight}px)`,
              }}
            >
              <div className="flex flex-col w-full" ref={responsesWrapperRef}>
                {responses.map((r, i) => (
                  <div key={i} className="p-6 w-full min-h-[calc(100vh-12rem)]">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {r.query}
                    </h2>
                    <div className="border-b border-gray-100 mb-3 flex gap-4 text-sm">
                      {["response", "papers", "images", "other"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() =>
                            setResponses((res) =>
                              res.map((item, idx) =>
                                idx === i ? { ...item, tab: tab as any } : item
                              )
                            )
                          }
                          className={`pb-1 ${
                            r.tab === tab
                              ? "border-b-2 border-orange-500 text-orange-600 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {tab === "papers"
                            ? `Papers (${selectedPaperIds.length})`
                            : tab[0].toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>

                    {r.tab === "response" && (
                      <p className="text-gray-800 whitespace-pre-line text-base leading-relaxed mb-4">
                        {r.response}
                      </p>
                    )}

                    {r.tab === "papers" && (
                      <div className="text-sm text-gray-700 space-y-2 mb-4">
                        {papers
                          .filter((p) => selectedPaperIds.includes(p.id))
                          .map((p) => (
                            <div
                              key={p.id}
                              className="border border-gray-200 p-3 rounded-lg bg-white shadow-sm"
                            >
                              {p.filename || "Untitled Paper"}
                            </div>
                          ))}
                      </div>
                    )}

                    {r.tab === "images" && (
                      <div className="text-sm text-gray-400 italic mb-4">
                        (No images to display.)
                      </div>
                    )}

                    {r.tab === "other" && (
                      <div className="text-sm text-gray-400 italic mb-4">
                        (No additional data.)
                      </div>
                    )}

                    <div className="flex gap-3 text-gray-400 text-sm">
                      <button className="hover:text-orange-600">
                        <span className="material-icons text-base">
                          thumb_up
                        </span>
                      </button>
                      <button className="hover:text-orange-600">
                        <span className="material-icons text-base">
                          thumb_down
                        </span>
                      </button>
                      <button className="hover:text-orange-600">
                        <span className="material-icons text-base">
                          content_copy
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up input */}
          <div className="fixed bottom-0 left-0 w-full py-4 z-10">
            <div className="max-w-3xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
              <textarea
                placeholder="Ask another question..."
                className="w-full resize-none bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none"
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-lg px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                    <span className="material-icons text-base">
                      attach_file
                    </span>
                    File
                  </button>
                  <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-lg px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                    <span className="material-icons text-base">mic</span>
                    Dictate
                  </button>
                  <button className="flex items-center gap-1 border border-orange-200 bg-white rounded-lg px-3 py-1 text-sm text-orange-600 hover:bg-orange-50">
                    <span className="material-icons text-base">smart_toy</span>
                    Model
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || loading}
                  className="text-orange-500 hover:text-orange-700 transition disabled:opacity-30"
                >
                  <span className="material-icons text-xl">send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Manual scroll controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              ↑
            </button>
            <button
              onClick={() =>
                setCurrentIndex((i) => Math.min(i + 1, responses.length - 1))
              }
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              ↓
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatViewer;
