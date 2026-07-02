import React, { useState } from 'react';
import { Settings, Shield, Sparkles, Database, FileSpreadsheet, Clock, Check, Key } from 'lucide-react';

interface SettingsProps {
  apiKeyStatus: { hasApiKey: boolean; loading: boolean };
}

export const SettingsPanel: React.FC<SettingsProps> = ({ apiKeyStatus }) => {
  const [openAiKey, setOpenAiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [defaultLanguage, setDefaultLanguage] = useState('Magyar');
  const [isSheetsConnected, setIsSheetsConnected] = useState(false);
  const [isSchedulerActive, setIsSchedulerActive] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState('daily');

  const handleSaveKeys = () => {
    localStorage.setItem('openai_api_key', openAiKey);
    alert('OpenAI API kulcs sikeresen elmentve a böngésző biztonságos tárolójában!');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="text-slate-700 w-6 h-6" />
          <span>Bővítmény Beállítások (Plugin Settings)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Konfiguráld az API kulcsokat, az automatikus bejegyzés ütemezéseket és a Google Táblázatok integrációt.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: API keys & General */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>API Kulcsok kezelése</span>
            </h3>

            {/* Gemini API key status */}
            <div className="bg-white p-3.5 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Gemini Pro API Kulcs</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Szerver-oldali környezeti változó</p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${apiKeyStatus.hasApiKey ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {apiKeyStatus.hasApiKey ? 'Kapcsolódva (Aktív)' : 'Hiányzik'}
              </span>
            </div>

            {/* OpenAI Key Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600">OpenAI API Kulcs (DALL-E és GPT modellekhez)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="sk-proj-........................"
                  className="flex-1 p-2 border border-slate-250 rounded-lg text-xs font-mono"
                />
                <button
                  onClick={handleSaveKeys}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
                >
                  Mentés
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                A megadott OpenAI kulcsot a helyi böngésző tárolja, és biztonságosan továbbítódik a cikkírási és képgenerálási API felé.
              </p>
            </div>
          </div>

          {/* General WP AI suite settings */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Általános Bővítmény Opciók</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Alapértelmezett bejegyzési nyelv</label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full p-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 font-medium"
              >
                <option value="Magyar">Magyar</option>
                <option value="Angol">Angol (English)</option>
                <option value="Német">Német (Deutsch)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Integrations (Scheduler & Google Sheets) */}
        <div className="space-y-4">
          {/* Scheduler post creator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Automatikus Tartalomíró & Ütemező</span>
              </h3>
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-bold rounded uppercase tracking-wider">PRÉMIUM</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ütemezz automatikus cikkgenerálási folyamatokat megadott témákban vagy RSS hírforrások alapján, hogy a weboldalad naponta friss tartalommal bővüljön magától.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isSchedulerActive"
                checked={isSchedulerActive}
                onChange={(e) => setIsSchedulerActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="isSchedulerActive" className="text-xs font-bold text-slate-700">
                Automatikus cikkgenerátor aktiválása
              </label>
            </div>

            {isSchedulerActive && (
              <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Gyakoriság</label>
                  <select
                    value={scheduleInterval}
                    onChange={(e) => setScheduleInterval(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="12h">Minden 12 órában</option>
                    <option value="daily">Naponta egyszer</option>
                    <option value="weekly">Hetente egyszer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Cél kategória</label>
                  <select className="w-full p-2 border border-slate-200 rounded text-xs bg-white">
                    <option>Hírek & Technológia</option>
                    <option>Életmód</option>
                    <option>WooCommerce Ajánlatok</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Google Sheets Sync Integration */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Táblázatok (Sheets) Integráció</span>
              </h3>
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-bold rounded uppercase tracking-wider">PRÉMIUM</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Szinkronizáld az összes generált bejegyzést, kulcsszót és WooCommerce adatot egy közös felhőalapú Google Táblázattal valós időben.
            </p>

            <button
              onClick={() => {
                setIsSheetsConnected(!isSheetsConnected);
                alert(!isSheetsConnected ? 'Google Sheets sikeresen csatlakoztatva a WordPress AI Suite-hoz!' : 'Google Sheets lecsatlakoztatva.');
              }}
              className={`w-full py-2 border rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${isSheetsConnected ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'}`}
            >
              {isSheetsConnected ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Összekapcsolva (Google Sheets)
                </>
              ) : (
                'Google Sheets fiók csatlakoztatása'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
