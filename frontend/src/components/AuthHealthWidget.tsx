import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

const API_BASE = '/monitor';

export function AuthHealthWidget() {
    const [authStats, setAuthStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAuthStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth-stats`);
            setAuthStats(res.data);
        } catch (err) {
            console.error('Error fetching auth stats:', err);
        }
    };

    const triggerTest = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE}/test-auth`);
            await fetchAuthStats();
        } catch (err) {
            console.error('Error triggering auth test:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthStats();
        const interval = setInterval(fetchAuthStats, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    if (!authStats) return null;

    const { stats, history } = authStats;
    const lastCheck = stats.lastCheck;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl col-span-full">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stats.successRate > 90 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {stats.successRate > 90 ? (
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                        ) : (
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">OAuth2 Flow Health</h3>
                        <p className="text-sm text-slate-400">Credentials verification (every 6 hours)</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-10">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Success Rate</p>
                        <p className={`text-2xl font-black ${stats.successRate > 90 ? 'text-green-500' : 'text-red-500'}`}>
                            {Math.round(stats.successRate)}%
                        </p>
                    </div>

                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Latency</p>
                        <p className="text-2xl font-black text-white">
                            {history.length > 0 ? Math.round(history.reduce((a: any, b: any) => a + b.latency, 0) / history.length) : 0}
                            <span className="text-sm font-normal text-slate-500 ml-1">ms</span>
                        </p>
                    </div>

                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Check</p>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <p className="text-sm font-bold text-slate-300">
                                {lastCheck ? new Date(lastCheck.timestamp).toLocaleTimeString() : 'Never'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={triggerTest}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 border border-slate-700"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-bold">Verify Now</span>
                    </button>
                </div>
            </div>

            {history.length > 0 && (
                <div className="mt-6 flex gap-1 h-3">
                    {history.slice(0, 50).reverse().map((log: any, i: number) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-sm ${log.success ? 'bg-green-500/40' : 'bg-red-500/60'}`}
                            title={`${new Date(log.timestamp).toLocaleString()} - ${log.success ? 'Success' : 'Failed'}: ${log.statusCode}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
