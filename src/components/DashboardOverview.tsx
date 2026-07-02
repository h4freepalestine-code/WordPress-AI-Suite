import React from 'react';
import { LayoutDashboard, FileText, Image, MessageSquare, Database, Sparkles, TrendingUp, Cpu, ShoppingBag } from 'lucide-react';
import { WPPost, WPProduct, AILog } from '../types';

interface DashboardProps {
  posts: WPPost[];
  products: WPProduct[];
  logs: AILog[];
  apiKeyStatus: { hasApiKey: boolean; loading: boolean };
  setTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardProps> = ({ posts, products, logs, apiKeyStatus, setTab }) => {
  const totalTokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);
  const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);

  const stats = [
    { label: 'Generált Bejegyzések', value: posts.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'WooCommerce Termékek', value: products.length, icon: ShoppingBag, color: 'text-purple-600 bg-purple-50' },
    { label: 'AI Generálások', value: logs.length, icon: Cpu, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Felhasznált Tokenek', value: totalTokens.toLocaleString(), icon: Sparkles, color: 'text-amber-600 bg-amber-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-xl p-8 shadow-md">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-300 via-indigo-600 to-slate-900" />
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>WordPress AI Engine v4.2.0</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Üdvözöl az AI-csomag WordPresshez!
          </h1>
          <p className="text-slate-300 text-base mb-6 leading-relaxed">
            Ez a legnépszerűbb, nyílt forráskódú AI megoldás WordPresshez. Generálj kiváló minőségű cikkeket, optimalizálj termékeket, képezz saját modelleket, és ágyazz be intelligens chatbotokat vektor-adatbázissal.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setTab('content')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow-sm"
            >
              Új cikk generálása
            </button>
            <button
              onClick={() => setTab('images')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium rounded-lg text-sm transition"
            >
              Művészi képgenerátor
            </button>
          </div>
        </div>
      </div>

      {/* API Key Banner if not set */}
      {!apiKeyStatus.loading && !apiKeyStatus.hasApiKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2..5 bg-amber-100 rounded-lg text-amber-800">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">Hiányzó Gemini API Kulcs</h4>
            <p className="text-xs text-amber-700 mt-1">
              A tartalom- és képgenerátor funkciók használatához meg kell adnod egy Gemini API kulcsot. Ezt megteheted a WordPress bővítmény beállítások oldalán.
            </p>
            <button
              onClick={() => setTab('settings')}
              className="mt-3 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg transition"
            >
              API Beállítások megnyitása
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Wizards */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <span>Gyors műveletek indítása</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setTab('content')}
              className="p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/20 text-left transition"
            >
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Szuper Cikkíró
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Magas minőségű, tetszőleges nyelvű cikk generálása Gemini segítségével, vázlatszerkesztővel.
              </p>
            </button>

            <button
              onClick={() => setTab('bulk')}
              className="p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/20 text-left transition"
            >
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Tömeges Cikkíró
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Generálj akár 5 cikket egyszerre ingyenesen címekből, CSV-ből vagy másolás-beillesztéssel.
              </p>
            </button>

            <button
              onClick={() => setTab('chatbot')}
              className="p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/20 text-left transition"
            >
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                Intelligens Chatbot
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Szerezz front-end widgetet Pinecone szemantikus keresővel és testreszabott stílusokkal.
              </p>
            </button>

            <button
              onClick={() => setTab('woocommerce')}
              className="p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/20 text-left transition"
            >
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                WooCommerce AI
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Optimalizáld termékeid címeit, hosszú és rövid leírásait a jobb SEO-helyezésért.
              </p>
            </button>
          </div>
        </div>

        {/* Right column: Recent Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Legutóbbi AI naplók</span>
            <button onClick={() => setTab('logs')} className="text-xs text-indigo-600 hover:underline">
              Mind
            </button>
          </h2>
          <div className="space-y-3">
            {logs.slice(0, 4).map((log) => (
              <div key={log.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="truncate max-w-[170px]">{log.action}</span>
                  <span className="text-slate-500">{log.model}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{log.timestamp}</span>
                  <span className="text-emerald-600 font-medium">{log.cost > 0 ? `$${log.cost.toFixed(5)}` : 'Ingyenes'}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                Nincsenek még generálási naplók.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
