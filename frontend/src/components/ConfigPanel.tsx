import React, { useState, useEffect } from 'react';
import { Settings, Save, Search, Check, X, Shield, Globe, ShieldAlert } from 'lucide-react';
import axios from 'axios';

interface Endpoint {
    path: string;
    method: string;
    summary: string;
}

interface Config {
    manualToken?: string;
    activeEndpoints: string[];
    emailRecipients: string[];
    alertEndpoints: string[];
}

interface OAuthStatus {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number;
    expiresIn: number;
    isManual: boolean;
}

export const ConfigPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [availableEndpoints, setAvailableEndpoints] = useState<Endpoint[]>([]);
    const [config, setConfig] = useState<Config>({ activeEndpoints: [], emailRecipients: [], alertEndpoints: [] });
    const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchOAuthStatus = async () => {
        try {
            const res = await axios.get('/monitor/oauth-status');
            setOauthStatus(res.data);
        } catch (err) {
            console.error('Failed to fetch OAuth status:', err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [endpointsRes, configRes] = await Promise.all([
                    axios.get('/monitor/available-endpoints'),
                    axios.get('/monitor/config')
                ]);
                setAvailableEndpoints(endpointsRes.data);
                setConfig(configRes.data);
                await fetchOAuthStatus();
            } catch (err) {
                console.error('Failed to fetch config:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (oauthStatus && oauthStatus.expiresAt > Date.now()) {
                setOauthStatus(prev => prev ? {
                    ...prev,
                    expiresIn: Math.floor((prev.expiresAt - Date.now()) / 1000)
                } : null);
            } else if (oauthStatus && oauthStatus.expiresAt <= Date.now()) {
                fetchOAuthStatus();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [oauthStatus]);

    const handleToggleEndpoint = (path: string) => {
        setConfig(prev => ({
            ...prev,
            activeEndpoints: prev.activeEndpoints.includes(path)
                ? prev.activeEndpoints.filter(p => p !== path)
                : [...prev.activeEndpoints, path]
        }));
    };

    const handleToggleAlert = (path: string) => {
        setConfig(prev => {
            const isAlert = prev.alertEndpoints.includes(path);
            if (!isAlert && prev.alertEndpoints.length >= 3) return prev;

            return {
                ...prev,
                alertEndpoints: isAlert
                    ? prev.alertEndpoints.filter(p => p !== path)
                    : [...prev.alertEndpoints, path]
            };
        });
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const emails = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
        setConfig(prev => ({ ...prev, emailRecipients: emails }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post('/monitor/config', config);
            onClose();
        } catch (err) {
            console.error('Failed to save config:', err);
        } finally {
            setSaving(false);
        }
    };

    const filteredEndpoints = availableEndpoints.filter(e =>
        e.path.toLowerCase().includes(search.toLowerCase()) ||
        e.summary.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Settings className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Monitoring Configuration</h2>
                            <p className="text-sm text-slate-400">Manage manual tokens and active endpoints</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Token Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-slate-400" />
                                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Authentication</h3>
                            </div>
                            {oauthStatus && (
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${oauthStatus.expiresIn > 300 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                        Expires at: {new Date(oauthStatus.expiresAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {oauthStatus && (
                            <div className="grid grid-cols-1 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl mb-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Access Token</label>
                                    <div className="text-xs font-mono text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800/50">
                                        {oauthStatus.accessToken || 'No token active'}
                                    </div>
                                </div>
                                {oauthStatus.refreshToken && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Refresh Token</label>
                                        <div className="text-xs font-mono text-slate-400 break-all bg-slate-900/30 p-2 rounded">
                                            {oauthStatus.refreshToken}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs text-slate-500">Manual Access Token Override</label>
                            <textarea
                                value={config.manualToken || ''}
                                onChange={(e) => setConfig({ ...config, manualToken: e.target.value })}
                                placeholder="Paste your Miele Access Token here..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-300 h-24 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-500">Email Recipients (comma separated)</label>
                            <textarea
                                value={config.emailRecipients.join(', ')}
                                onChange={handleEmailChange}
                                placeholder="admin@example.com, dev@example.com..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-300 h-20 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all resize-none"
                            />
                        </div>
                    </section>

                    {/* Endpoints Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-slate-400" />
                                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Endpoints to Monitor</h3>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                                {config.activeEndpoints.length} Selected
                            </span>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search endpoints..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        {/* List */}
                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredEndpoints.map((endpoint) => {
                                const isActive = config.activeEndpoints.includes(endpoint.path);
                                return (
                                    <div
                                        key={`${endpoint.method}-${endpoint.path}`}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive
                                            ? 'bg-blue-500/10 border-blue-500/30'
                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        <button
                                            onClick={() => handleToggleEndpoint(endpoint.path)}
                                            className={`shrink-0 p-1.5 rounded-lg ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                                        >
                                            <Check className={`w-3 h-3 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                                        </button>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                                                    }`}>
                                                    {endpoint.method}
                                                </span>
                                                <span className="text-sm text-slate-200 font-mono truncate">{endpoint.path}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">{endpoint.summary}</p>
                                        </div>
                                        {isActive && (
                                            <button
                                                onClick={() => handleToggleAlert(endpoint.path)}
                                                className={`p-2 rounded-lg transition-all ${config.alertEndpoints.includes(endpoint.path)
                                                    ? 'bg-amber-500/20 text-amber-500'
                                                    : 'bg-slate-800 text-slate-600 hover:text-slate-400'}`}
                                                title={config.alertEndpoints.includes(endpoint.path) ? "Active Alert" : "Set as Alert Endpoint"}
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};
