import React from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ResponseViewerProps {
    data: any;
    onClose: () => void;
    title: string;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ data, onClose, title }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                        <p className="text-xs text-slate-500 font-mono">Full API Response Context</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors group relative"
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-6 bg-slate-950/50">
                    <pre className="font-mono text-sm text-blue-300 whitespace-pre-wrap break-all leading-relaxed">
                        {data ? JSON.stringify(data, null, 2) : '// No response data available'}
                    </pre>
                </div>
                <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between uppercase tracking-widest font-bold">
                    <span>Miele API Response</span>
                    <span>Status: Dynamic</span>
                </div>
            </div>
        </div>
    );
};
