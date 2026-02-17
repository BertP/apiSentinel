import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Shield, List, BarChart3, AlertCircle, CheckCircle2, Smartphone, Radio, Settings, ExternalLink, Trash2 } from 'lucide-react';
import { Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DebugTerminal } from './components/DebugTerminal';
import { ConfigPanel } from './components/ConfigPanel';
import { AuthHealthWidget } from './components/AuthHealthWidget';
import { ResponseViewer } from './components/ResponseViewer';

const API_BASE = '/monitor';

interface Stat {
  path: string;
  method: string;
  count: number;
  successCount: number;
  avgLatency: number;
  lastStatus: number;
  lastTimestamp: string;
  deviceId?: string;
}

interface Log {
  timestamp: string;
  path: string;
  method: string;
  deviceId?: string;
  statusCode: number;
  latency: number;
  success: boolean;
  validationError?: string;
  responseData?: any;
  requestData?: any;
}

interface AccountDevice {
  deviceId: string;
  typeRaw: number;
  typeLocalized: string;
  fabNumber: string;
  protocolVersion: number;
  deviceName: string;
  techType: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [stats, setStats] = useState<Stat[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [accountDevices, setAccountDevices] = useState<AccountDevice[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, logsRes, devicesRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/logs`),
        axios.get(`${API_BASE}/account-overview`)
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setAccountDevices(devicesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const removeEndpoint = async (path: string) => {
    try {
      if (!confirm(`Stop monitoring ${path}?`)) return;
      const configRes = await axios.get(`${API_BASE}/config`);
      const currentConfig = configRes.data;
      const updatedConfig = {
        ...currentConfig,
        activeEndpoints: currentConfig.activeEndpoints.filter((p: string) => p !== path)
      };
      await axios.post(`${API_BASE}/config`, updatedConfig);
      await fetchData();
    } catch (err) {
      console.error('Error removing endpoint:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    const eventSource = new EventSource(`${API_BASE}/events`);
    eventSource.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const getChartData = (path: string, method: string) => {
    return logs
      .filter(l => l.path === path && l.method === method)
      .slice(0, 20)
      .reverse()
      .map(l => ({
        time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latency: l.latency
      }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-6 z-20">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            API SENTINEL
          </h1>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'logs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <List className="w-5 h-5" />
            <span className="font-medium">Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'devices' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Devices</span>
          </button>
          <button
            onClick={() => setActiveTab('streams')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'streams' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Live Monitor</span>
          </button>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200"
          >
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-medium">API Docs</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <main className="ml-64 p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-slate-400">Real-time API performance monitoring</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-300">Monitoring Active</span>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <AuthHealthWidget />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 group shadow-xl">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded ${stat.method === 'GET' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {stat.method}
                        </span>
                        <span className="text-sm text-slate-300 font-mono font-medium">{stat.path}</span>
                        {stat.deviceId && (
                          <span className="text-[10px] text-slate-500 font-mono">[{stat.deviceId}]</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Last check: {new Date(stat.lastTimestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeEndpoint(stat.path)}
                        className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {stat.lastStatus >= 200 && stat.lastStatus < 300 ? (
                        <div className="bg-green-500/10 p-2 rounded-full">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      ) : (
                        <div className="bg-red-500/10 p-2 rounded-full">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData(stat.path, stat.method)}>
                        <defs>
                          <linearGradient id={`colorLat-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="latency"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill={`url(#colorLat-${i})`}
                          strokeWidth={2}
                        />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-4xl font-bold tabular-nums tracking-tight">
                        {Math.round(stat.avgLatency)}
                        <span className="text-sm font-normal text-slate-500 ml-1">ms</span>
                      </span>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-2xl font-bold text-white leading-none">{stat.lastStatus}</p>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${stat.successCount / stat.count > 0.9 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${(stat.successCount / stat.count) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Uptime: {Math.round((stat.successCount / stat.count) * 100)}%</span>
                      <span>Total: {stat.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Device ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Endpoint</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Validation</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.map((log, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400 tabular-nums">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {log.deviceId || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${log.method === 'GET' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            {log.method}
                          </span>
                          <span className="text-sm font-mono text-slate-300 font-medium">{log.path}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.validationError ? (
                          <div className="flex justify-center" title={log.validationError}>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-300 font-medium tabular-nums">{log.latency}</span>
                        <span className="text-xs text-slate-500 ml-1">ms</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="space-y-6">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white mb-2">ACCOUNT OVERVIEW</h2>
                <p className="text-slate-500 font-medium">Detailed list of all devices mapped to this account.</p>
              </div>
            </header>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Type (Raw)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Type (Localized)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">FabNumber</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Protocol</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Device Name</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Tech Type</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {accountDevices.map((device) => (
                      <tr key={device.deviceId} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-mono text-slate-400">{device.typeRaw}</td>
                        <td className="px-6 py-4 font-medium text-slate-200">{device.typeLocalized}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">{device.fabNumber}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">v{device.protocolVersion}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{device.deviceName || '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{device.techType}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${device.statusLocalized === 'Running' || device.statusLocalized === 'In Betrieb' || device.statusLocalized?.includes('Running') ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
                            {device.statusLocalized || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'streams' && (
          <div className="space-y-6">
            <header className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white mb-2">LIVE EVENT MONITOR</h2>
                <p className="text-slate-500 font-medium">Manage and monitor persistent Server-Sent Event (SSE) streams.</p>
              </div>
              <button
                onClick={() => window.open(`${API_BASE}/sse-viewer`, '_blank')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 text-sm whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                Open Live Terminal
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-tight">Main Account Stream</h3>
                    <p className="text-xs text-slate-500">Monitor all devices on this account</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await axios.post(`${API_BASE}/sse/start`, { path: '/devices/all/events' });
                      alert('Account wide SSE monitor started!');
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Start Stream
                  </button>
                  <button
                    onClick={async () => {
                      await axios.post(`${API_BASE}/sse/stop`, { path: '/devices/all/events' });
                      alert('Account wide SSE monitor stopped.');
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm border border-slate-700"
                  >
                    Stop
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-tight">Single Device Stream</h3>
                    <p className="text-xs text-slate-500">High-fidelity monitor for one hardware ID</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button disabled className="flex-1 bg-slate-800 text-slate-500 font-bold py-2 px-4 rounded-lg text-sm border border-slate-700">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Stream Health & Log Flow</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-slate-300">Backend Stream Processor</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">READY</span>
                </div>
                <p className="text-xs text-slate-500 italic">
                  Note: Real-time events from SSE streams will automatically appear in your main "Logs" tab and the "Debug Console" below, marked with method <span className="text-blue-500 font-bold">SSE</span>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <DebugTerminal onLogClick={(log) => setSelectedLog(log as any)} />
      {isConfigOpen && <ConfigPanel onClose={() => setIsConfigOpen(false)} />}
      {selectedLog && (
        <ResponseViewer
          title={`${selectedLog.method} ${selectedLog.path}`}
          data={selectedLog.responseData}
          requestData={selectedLog.requestData}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

export default App;
