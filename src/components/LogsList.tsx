import React, { useState } from 'react';
import { Database, Search, Trash, Terminal, TrendingUp } from 'lucide-react';
import { AILog } from '../types';

interface LogsProps {
  logs: AILog[];
  onClearLogs: () => void;
}

export const LogsList: React.FC<LogsProps> = ({ logs, onClearLogs }) => {
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.model.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="text-slate-700 w-6 h-6" />
            <span>AI Generálási Naplók és Költségek (Logs)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Tekintsd át az összes korábbi mesterséges intelligencia generálást, felhasznált tokent és kalkulált API költséget.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm('Biztosan törölni szeretnéd az összes generálási naplót?')) {
                onClearLogs();
              }
            }}
            className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-lg transition"
          >
            Összes törlése
          </button>
        </div>
      </div>

      {/* Cost info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Összesített API költség</span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">${totalCost.toFixed(5)}</h3>
        </div>
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Tranzakciók száma</span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">{logs.length} db generálás</h3>
        </div>
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Bővítmény státusz</span>
          <h3 className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1">Aktív / Normál</h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés a naplók között..."
          className="pl-8 pr-3 py-2 border border-slate-250 rounded-lg text-xs w-72 text-slate-800 focus:outline-none focus:border-indigo-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
      </div>

      {/* Logs Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
              <th className="p-4">Dátum / Idő</th>
              <th className="p-4">Művelet</th>
              <th className="p-4">Alkalmazott Modell</th>
              <th className="p-4 text-right">Hossz / Token</th>
              <th className="p-4 text-right">Költség</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition">
                <td className="p-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                <td className="p-4 font-semibold text-slate-800">{log.action}</td>
                <td className="p-4 font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50/40 px-1.5 py-0.5 rounded w-fit">{log.model}</td>
                <td className="p-4 text-right font-mono text-[11px]">{log.tokensUsed > 0 ? `${log.tokensUsed.toLocaleString()} t` : `${log.responseLength || 0} char`}</td>
                <td className="p-4 text-right font-semibold text-emerald-600">{log.cost > 0 ? `$${log.cost.toFixed(5)}` : 'Ingyenes / Teszt'}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                  Nem található a keresésnek megfelelő napló.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
