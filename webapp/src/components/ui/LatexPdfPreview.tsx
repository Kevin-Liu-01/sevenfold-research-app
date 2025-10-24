import React, { useState, useEffect } from 'react';
import supabase from '../../auth/supabaseClient';

interface LatexPdfPreviewProps {
    compositionId: string;
    triggerCompile: number; // Increment this to trigger recompilation
}

/**
 * Component that compiles LaTeX and displays the resulting PDF.
 * 
 * Usage:
 *   const [compileCounter, setCompileCounter] = useState(0);
 *   <LatexPdfPreview 
 *     compositionId={composition.id} 
 *     triggerCompile={compileCounter}
 *   />
 *   <button onClick={() => setCompileCounter(c => c + 1)}>Compile</button>
 */
export const LatexPdfPreview: React.FC<LatexPdfPreviewProps> = ({ 
    compositionId, 
    triggerCompile 
}) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCompiling, setIsCompiling] = useState(false);

    useEffect(() => {
        // Don't compile on initial mount with triggerCompile = 0
        if (triggerCompile === 0) return;

        const compile = async () => {
            setIsCompiling(true);
            setError(null);
            
            // Clean up previous PDF URL
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }

            try {
                const { data: { session }, error: authErr } = await supabase.auth.getSession();
                
                if (authErr || !session?.access_token) {
                    throw new Error('Not authenticated');
                }

                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/compose/compile-latex/${compositionId}`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${session.access_token}`
                        }
                    }
                );

                if (response.ok) {
                    // Check content type to ensure we got a PDF
                    const contentType = response.headers.get('content-type');
                    if (contentType === 'application/pdf') {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        setPdfUrl(url);
                    } else {
                        // Got JSON error instead
                        const errorData = await response.json();
                        throw new Error(errorData.detail || 'Unknown error');
                    }
                } else {
                    // Handle error response
                    const errorData = await response.json().catch(() => ({ detail: 'Compilation failed' }));
                    throw new Error(errorData.detail || `HTTP ${response.status}`);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(errorMessage);
                console.error('LaTeX compilation error:', err);
            } finally {
                setIsCompiling(false);
            }
        };

        compile();

        // Cleanup function to revoke object URL when component unmounts
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [compositionId, triggerCompile]);

    if (isCompiling) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                    <div className="text-center">
                        <p className="text-lg font-medium text-gray-700">Compiling LaTeX...</p>
                        <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full bg-gray-50 p-6 overflow-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <span className="material-icons text-red-600 text-2xl">error_outline</span>
                        <div className="flex-1">
                            <h3 className="font-semibold text-red-800 text-lg mb-2">
                                Compilation Error
                            </h3>
                            <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono bg-red-100 p-3 rounded overflow-auto max-h-96">
                                {error}
                            </pre>
                            <p className="text-sm text-red-600 mt-3">
                                💡 Tip: Check for syntax errors, missing packages, or undefined commands.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!pdfUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
                <div className="text-center">
                    <span className="material-icons text-gray-300 text-6xl mb-4">description</span>
                    <h3 className="text-xl font-medium text-gray-500 mb-2">No PDF Preview</h3>
                    <p className="text-gray-400">Click "Compile PDF" to generate preview</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gray-100">
            <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="LaTeX PDF Preview"
            />
        </div>
    );
};

export default LatexPdfPreview;
