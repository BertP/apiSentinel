import React, { useState } from 'react';
import { X, Copy, Check, FileJson, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ResponseViewerProps {
    data: any;
    requestData?: any;
    onClose: () => void;
    title: string;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ data, requestData, onClose, title }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'response' | 'request'>(requestData ? 'request' : 'response');

    const displayData = activeTab === 'request' ? requestData : data;

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(displayData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                        <p className="text-xs text-slate-500 font-mono">Payload Inspection</p>
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

                {/* Tabs */}
                {requestData && (
                    <div className="flex px-6 bg-slate-900/30 border-b border-slate-800/50">
                        <button
                            onClick={() => setActiveTab('request')}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'request'
                                ? 'border-orange-500 text-orange-500 bg-orange-500/5'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Request Body
                        </button>
                        <button
                            onClick={() => setActiveTab('response')}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'response'
                                ? 'border-blue-500 text-blue-500 bg-blue-500/5'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            Response Data
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-slate-950/50">
                    <pre className={`font-mono text-sm whitespace-pre-wrap break-all leading-relaxed ${activeTab === 'request' ? 'text-orange-300' : 'text-blue-300'
                        }`}>
                        {displayData ? JSON.stringify(displayData, null, 2) : `// No ${activeTab} data available`}
                    </pre>
                </div>

                <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                        <FileJson className="w-3 h-3" />
                        <span>Miele API Interaction</span>
                    </div>
                    <span>{activeTab === 'request' ? 'Outgoing Payload' : 'Incoming Response'}</span>
                </div>
            </div>
        </div>
    );
};
