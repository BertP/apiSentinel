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

interface DebugTerminalProps {
    onLogClick?: (log: LogEntry) => void;
}

export const DebugTerminal: React.FC<DebugTerminalProps> = ({ onLogClick }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const eventSource = new EventSource('/monitor/events');

        eventSource.onopen = () => {
            console.log('SSE Connected');
            setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
            try {
                const newLog = JSON.parse(event.data);
                setLogs((prev) => [...prev.slice(-99), newLog]);
            } catch (e) {
                console.error('Failed to parse SSE event:', e);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            setIsConnected(false);
        };

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

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 p-3 rounded-full shadow-2xl hover:bg-slate-800 transition-all z-50 group"
            >
                <TerminalIcon className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-0 right-0 transition-all duration-300 z-50 ${isExpanded ? 'w-full h-1/2' : 'w-[500px] h-[350px] mb-6 mr-6'
                }`}
        >
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-xl flex flex-col h-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <TerminalIcon className={`w-4 h-4 ${isConnected ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Debug Console</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setLogs([])}
                            className="p-1 px-2 hover:bg-slate-800 rounded transition-colors"
                            title="Clear Logs"
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

                {/* Content */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto font-mono text-[11px] p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                >
                    {logs.length === 0 && (
                        <div className="text-slate-600 italic">Waiting for incoming monitoring events...</div>
                    )}
                    {logs.map((log, i) => (
                        <div
                            key={i}
                            onClick={() => onLogClick?.(log)}
                            className="flex gap-2 group border-l-2 border-transparent hover:border-blue-500/30 pl-2 -ml-2 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                            <span className="text-slate-600 whitespace-nowrap">
                                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                            </span>
                            <span className={`font-bold min-w-[35px] ${log.method === 'GET' ? 'text-green-500' : 'text-orange-500'}`}>
                                {log.method}
                            </span>
                            <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap">
                                [{log.deviceId || '?'}]
                            </span>
                            <span className="text-slate-300 truncate flex-1">{log.path}</span>
                            <span className={`font-bold ${log.success ? 'text-blue-400' : 'text-red-400'}`}>
                                {log.statusCode}
                            </span>
                            <span className="text-slate-500 w-12 text-right">
                                {log.latency}ms
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
