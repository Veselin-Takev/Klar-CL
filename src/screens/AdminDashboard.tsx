import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldAlert, CheckCircle2, AlertCircle, Clock, Server, MonitorSmartphone } from 'lucide-react';
import { getSyncLogs, clearSyncLogs } from '../lib/offlineQueue';
import { CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis } from 'recharts';
import * as d3 from 'd3';

// Simulate device types for logs since we might not have it in the real logs
const DEVICE_TYPES = ['Mobile iOS', 'Mobile Android', 'Desktop Web', 'Tablet'];

function D3LatencyChart({ data }: { data: any[] }) {
  const d3Container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!d3Container.current || data.length === 0) return;

    // Clear previous SVG
    d3.select(d3Container.current).selectAll('*').remove();

    const width = d3Container.current.clientWidth;
    const height = d3Container.current.clientHeight;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(d3Container.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const x = d3.scalePoint()
      .domain(data.map(d => d.name))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => (d.latency as number)) || 0]).nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<any>()
      .x(d => x(d.name) || 0)
      .y(d => y(d.latency));

    // Add Grid
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(-width + margin.left + margin.right).tickFormat(() => ''))
      .attr('stroke-opacity', 0.1);

    // Add X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map(d => d.name)))
      .attr('color', '#888');

    // Add Y Axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}ms`))
      .attr('color', '#888');

    // Add Line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add Dots
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.name) || 0)
      .attr('cy', d => y(d.latency))
      .attr('r', 4)
      .attr('fill', '#10b981');

  }, [data]);

  return <div ref={d3Container} className="w-full h-full" />;
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [averageLatency, setAverageLatency] = useState(0);
  const [maintenanceReason, setMaintenanceReason] = useState('Manuelle Aktivierung');
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  
  useEffect(() => {
    loadLogs();
    
    // Load maintenance logs from localStorage (simulating local DB)
    const storedMaintenanceLogs = localStorage.getItem('klar_maintenance_logs');
    if (storedMaintenanceLogs) {
      setMaintenanceLogs(JSON.parse(storedMaintenanceLogs));
    }
    
    // Simulate real-time updates for the dashboard
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const loadLogs = async () => {
    const rawLogs = await getSyncLogs();
    
    // Add simulated device types if they don't exist
    const enhancedLogs = rawLogs.map((log: any) => ({
      ...log,
      deviceType: log.deviceType || DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)]
    }));
    
    setLogs(enhancedLogs);
    
    if (enhancedLogs.length > 0) {
      const successful = enhancedLogs.filter(l => l.status === 'success');
      if (successful.length > 0) {
        const avg = successful.reduce((acc, log) => acc + log.latencyMs, 0) / successful.length;
        setAverageLatency(Math.round(avg));
      }
    }
  };
  
  const toggleMaintenance = () => {
    const newState = !isMaintenance;
    setIsMaintenance(newState);
    
    // Log transition
    const newLog = {
      timestamp: Date.now(),
      action: newState ? 'Aktiviert' : 'Deaktiviert',
      reason: newState ? maintenanceReason : 'Normalbetrieb wiederhergestellt',
      admin: 'System Admin'
    };
    
    const updatedLogs = [newLog, ...maintenanceLogs];
    setMaintenanceLogs(updatedLogs);
    localStorage.setItem('klar_maintenance_logs', JSON.stringify(updatedLogs));
    
    const event = new CustomEvent('klar-maintenance-mode', {
      detail: newState ? 'on' : 'off'
    });
    window.dispatchEvent(event);
  };
  
  const handleClearLogs = async () => {
    await clearSyncLogs();
    loadLogs();
  };
  
  const chartData = logs.filter(l => l.status === 'success').map((l) => ({
    name: new Date(l.syncedAt).toLocaleTimeString(),
    latency: l.latencyMs
  })).slice(-20); // Show last 20
  
  // Prepare heatmap data
  const heatmapData = logs.filter(l => l.status === 'success').map((l, index) => ({
    timeIndex: index % 10,
    deviceTypeIndex: DEVICE_TYPES.indexOf(l.deviceType),
    deviceType: l.deviceType,
    latency: l.latencyMs
  }));
  
  return (
    <div className="flex-1 overflow-y-auto pb-24 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <Server className="text-brand" />
          System Administration
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">Sync-Analyse & Wartung</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-2 text-stone-500 dark:text-stone-400">
            <Clock size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Ø Latenz</span>
          </div>
          <div className="text-3xl font-bold text-stone-900 dark:text-white">
            {averageLatency} <span className="text-sm font-medium text-stone-500">ms</span>
          </div>
        </div>
        <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-2 text-stone-500 dark:text-stone-400">
            <Activity size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Sync Events</span>
          </div>
          <div className="text-3xl font-bold text-stone-900 dark:text-white">
            {logs.length}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 mb-6">
        <div className="flex flex-col mb-4">
          <h2 className="font-bold text-stone-900 dark:text-white mb-2">Wartungsmodus</h2>
          <div className="flex items-center justify-between gap-4">
            <input 
              type="text"
              disabled={isMaintenance}
              placeholder="Grund (z.B. Sync-Queue-Overflow)"
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
              className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              aria-label="Wartungsmodus Grund"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMaintenance}
              className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors ${
                isMaintenance 
                  ? 'bg-red-500 text-white' 
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
              aria-label={isMaintenance ? 'Wartungsmodus deaktivieren' : 'Wartungsmodus aktivieren'}
            >
              <ShieldAlert size={16} />
              {isMaintenance ? 'Deaktivieren' : 'Aktivieren'}
            </motion.button>
          </div>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Blockiert den Datenzugriff für alle Nutzer und zeigt einen systemweiten Wartungshinweis an. Ideal für Datenbank-Migrationen oder bei Sync-Störungen.
        </p>
        
        {maintenanceLogs.length > 0 && (
          <div className="mt-4 border-t border-stone-100 dark:border-stone-700 pt-4">
            <h3 className="text-sm font-semibold mb-2">Wartungs-Protokoll</h3>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {maintenanceLogs.map((log, i) => (
                <div key={i} className="text-xs flex flex-col bg-stone-50 dark:bg-stone-900 p-2 rounded">
                  <div className="flex justify-between font-medium">
                    <span>{log.action}</span>
                    <span className="text-stone-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-stone-600 dark:text-stone-400">Grund: {log.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 mb-6">
        <h2 className="font-bold text-stone-900 dark:text-white mb-4">Sync-Latenz (Echtzeit)</h2>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <D3LatencyChart data={chartData} />
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-sm">
              Noch keine erfolgreichen Sync-Vorgänge aufgezeichnet.
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MonitorSmartphone className="text-brand" />
          <h2 className="font-bold text-stone-900 dark:text-white">Hardware Latenz Heatmap</h2>
        </div>
        <div className="h-64 w-full">
          {heatmapData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" opacity={0.2} />
                <XAxis type="number" dataKey="timeIndex" name="Zeitachse" stroke="#888" fontSize={12} tick={false} />
                <YAxis type="number" dataKey="deviceTypeIndex" name="Gerät" stroke="#888" fontSize={12} tickFormatter={(val) => DEVICE_TYPES[val] || ''} domain={[0, DEVICE_TYPES.length - 1]} ticks={[0, 1, 2, 3]} />
                <ZAxis type="number" dataKey="latency" range={[20, 400]} name="Latenz" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'Latenz') return [`${value} ms`, 'Latenz'];
                    if (name === 'Gerät') return [DEVICE_TYPES[value], 'Gerät'];
                    return [value, name];
                  }}
                />
                <Scatter name="Latenz" data={heatmapData} fill="#f43f5e" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-sm">
              Zu wenig Daten für Heatmap-Visualisierung.
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex justify-between items-center">
          <h2 className="font-bold text-stone-900 dark:text-white">Letzte Sync-Ereignisse</h2>
          <button onClick={handleClearLogs} className="text-xs text-stone-500 hover:text-brand transition-colors" aria-label="Protokoll leeren">
            Protokoll leeren
          </button>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-700">
          {logs.slice().reverse().slice(0, 10).map((log, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {log.status === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-500" aria-label="Erfolgreich" />
                  ) : (
                    <AlertCircle size={16} className="text-red-500" aria-label="Fehler" />
                  )}
                  <span className="font-medium text-sm text-stone-900 dark:text-white">
                    {log.type}
                  </span>
                  <span className="text-[10px] bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded text-stone-500">
                    {log.deviceType}
                  </span>
                </div>
                <div className="text-xs text-stone-500">
                  {new Date(log.queuedAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono text-sm ${log.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>
                  {log.latencyMs} ms
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-8 text-center text-stone-500 text-sm">
              Keine Ereignisse im Protokoll
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
