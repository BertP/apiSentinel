import React, { useEffect, useState, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2 } from 'lucide-react';

interface LogEntry {
    timestamp: string;
    path: string;
    method: string;
    deviceId?: string;
    statusCode: number;
    latency: number;
    success: boolean;
    error?: string;
    responseData?: any;
    requestData?: any;
}

export const SplitMonitor: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const eventSource = new EventSource('/monitor/events');

        eventSource.onopen = () => setIsConnected(true);
        eventSource.onmessage = (event) => {
            try {
                const newLog = JSON.parse(event.data);
                setLogs((prev) => [...prev.slice(-49), newLog]);
            } catch (e) {
                console.error('Failed to parse SSE event:', e);
            }
        };
        eventSource.onerror = () => setIsConnected(false);

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const formatCurl = (log: LogEntry) => {
        const baseUrl = 'https://api.mcs3.miele.com/v1';
        const fullUrl = `${baseUrl}${log.path}`;
        let curl = `curl -X ${log.method} "${fullUrl}" \\\n  -H "Authorization: Bearer [REDACTED]" \\\n  -H "User-Agent: API-Sentinel/v0.0.1"`;

        if (log.requestData && Object.keys(log.requestData).length > 0) {
            curl += ` \\\n  -d '${JSON.stringify(log.requestData)}'`;
        }
        return curl;
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-24 bg-slate-900 border border-slate-700 p-3 rounded-full shadow-2xl hover:bg-slate-800 transition-all z-40 group"
            >
                <TerminalIcon className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-0 left-64 right-0 transition-all duration-300 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 ${isExpanded ? 'h-2/3' : 'h-[300px]'
                }`}
        >
            {/* Header */}
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Live Traffic Monitor</span>
                    <span className="text-[10px] text-slate-600 font-mono">| {logs.length} entries</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setLogs([])}
                        className="p-1 px-2 hover:bg-slate-800 rounded transition-colors"
                        title="Clear History"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 px-2 hover:bg-slate-800 rounded transition-colors"
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 px-2 hover:bg-red-500/20 rounded group transition-colors"
                    >
                        <X className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400" />
                    </button>
                </div>
            </div>

            {/* Split Header Labels */}
            <div className="flex text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-900 bg-slate-950/50">
                <div className="w-1/2 px-4 py-1 border-r border-slate-800">Request (cURL)</div>
                <div className="w-1/2 px-4 py-1">Response (JSON)</div>
            </div>

            {/* Content Container */}
            <div
                ref={scrollRef}
                className="h-[calc(100%-60px)] overflow-y-auto font-mono text-[11px] divide-y divide-slate-900/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
            >
                {logs.length === 0 && (
                    <div className="p-8 text-center text-slate-600 italic">
                        No traffic detected. Monitoring active...
                    </div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="flex min-h-[60px] hover:bg-white/5 transition-colors group">
                        {/* Left Side: Request */}
                        <div className="w-1/2 p-3 border-r border-slate-900/80 relative">
                            <span className="absolute top-2 right-2 text-[9px] text-slate-700 font-bold tabular-nums">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                            </span>
                            <pre className="text-blue-400/80 leading-relaxed whitespace-pre-wrap break-all">
                                {formatCurl(log)}
                            </pre>
                        </div>

                        {/* Right Side: Response */}
                        <div className="w-1/2 p-3 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold ${log.success ? 'text-green-500' : 'text-red-500'}`}>
                                    HTTP {log.statusCode}
                                </span>
                                <span className="text-slate-600 text-[10px]">{log.latency}ms</span>
                            </div>
                            <pre className="text-slate-400/90 whitespace-pre-wrap break-all">
                                {log.responseData ? JSON.stringify(log.responseData, null, 2) : (log.error ? `Error: ${log.error}` : '{}')}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
