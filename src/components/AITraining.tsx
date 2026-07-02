import React, { useState, useEffect } from 'react';
import { Cpu, Database, Play, Sparkles, Loader, RefreshCw, CheckCircle, Download } from 'lucide-react';
import { TrainingModel, WPPost, WPProduct } from '../types';

interface TrainingProps {
  posts: WPPost[];
  products: WPProduct[];
  onAddLog: (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => void;
}

export const AITraining: React.FC<TrainingProps> = ({ posts, products, onAddLog }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedJsonl, setExportedJsonl] = useState('');
  const [modelName, setModelName] = useState('bambusz_szakerto_v1');
  const [baseModel, setBaseModel] = useState('gemini-3.5-flash');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentLoss, setCurrentLoss] = useState<number>(1.50);

  const [trainedModels, setTrainedModels] = useState<TrainingModel[]>([
    {
      id: 'm-1',
      name: 'bambusz_iroda_guru',
      baseModel: 'gemini-3.5-flash',
      status: 'completed',
      datasetSize: 14,
      lossHistory: [1.45, 0.92, 0.48, 0.22, 0.11],
      dateCreated: '2026-06-25'
    }
  ]);

  const handleExportJSONL = () => {
    setIsExporting(true);
    setTimeout(() => {
      // Create valid JSONL records based on active posts
      const lines = posts.map(post => {
        return JSON.stringify({
          messages: [
            { role: 'system', content: 'Te egy professzionális marketing cikkíró vagy.' },
            { role: 'user', content: `Írj egy cikket a következő témában: ${post.title}` },
            { role: 'model', content: post.content.substring(0, 200) + '...' }
          ]
        });
      });

      setExportedJsonl(lines.join('\n'));
      setIsExporting(false);
      alert('WordPress adatbázis sikeresen konvertálva és exportálva JSONL formátumba fine-tuning betanításhoz!');
    }, 1200);
  };

  const handleStartTraining = () => {
    if (!modelName.trim()) {
      alert('Kérlek adj meg egy nevet a finomhangolt modellednek!');
      return;
    }
    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentLoss(1.50);
  };

  useEffect(() => {
    if (!isTraining) return;

    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        const next = prev + 5;
        // Simulate decreasing loss curve in real-time
        setCurrentLoss(l => Math.max(0.08, l - 0.07 + Math.random() * 0.02));

        if (next >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          const newModel: TrainingModel = {
            id: `m-${Date.now()}`,
            name: modelName,
            baseModel,
            status: 'completed',
            datasetSize: posts.length + products.length,
            lossHistory: [1.45, 0.98, 0.52, 0.24, 0.09],
            dateCreated: new Date().toISOString().split('T')[0]
          };
          setTrainedModels([newModel, ...trainedModels]);
          onAddLog(
            `Modell betanítás indítása (Fine-Tune): '${modelName}'`,
            'gemini-3.5-flash-tuning',
            exportedJsonl.length,
            0,
            0,
            0.015
          );
          alert(`Gratulálunk! A(z) "${modelName}" egyedi finomhangolt modelled sikeresen elkészült és azonnal használható a játszótéren vagy a generátorokban!`);
          return 100;
        }
        return next;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isTraining]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="text-indigo-600 w-6 h-6" />
          <span>AI-betanítás és Finomhangolás (Fine-Tuning)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Képezd ki a saját egyedi nyelvi modelledet a WordPress oldalad korábbi cikkei, termékei és stílusa alapján.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: DB to JSONL & fine-tune settings (col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Section 1: JSONL Exporter */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Database className="w-4 h-4 text-emerald-600" />
              1. Adatbázis Konvertálása JSONL formátumba
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Az AI modellek betanításához speciális JSONL (JSON Lines) formátumra van szükség. A bővítményünk egy kattintással átalakítja az összes bejegyzésedet és WooCommerce termékedet betanítási adathalmazzá.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportJSONL}
                disabled={isExporting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                {isExporting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                WP Adatbázis exportálása JSONL-be
              </button>
            </div>

            {exportedJsonl && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Exportált adatsorok (Minta)</span>
                  <button
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([exportedJsonl], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = "wordpress_dataset.jsonl";
                      document.body.appendChild(element);
                      element.click();
                    }}
                    className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Download className="w-3 h-3" />
                    Letöltés .jsonl
                  </button>
                </div>
                <pre className="w-full p-2.5 font-mono text-[9px] text-slate-600 bg-slate-900 rounded-lg overflow-x-auto max-h-[120px]">
                  {exportedJsonl}
                </pre>
              </div>
            )}
          </div>

          {/* Section 2: Fine-Tuning controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-4 h-4 text-indigo-500" />
              2. Modell Finomhangolási beállítások
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Új Modell Neve</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="bambusz_szakerto_v1"
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alap Modell (Base Model)</label>
                <select
                  value={baseModel}
                  onChange={(e) => setBaseModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 font-medium"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Ajánlott)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartTraining}
              disabled={isTraining || !exportedJsonl}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-45 disabled:pointer-events-none"
            >
              {!exportedJsonl ? (
                'Kérlek konvertáld az adatbázist először'
              ) : isTraining ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Tuning folyamatban ({trainingProgress}%)
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Egyedi AI Modell Tanítás indítása
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right pane: Training dashboard & loss curves (col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Training Status */}
          {isTraining && (
            <div className="bg-indigo-900 text-white rounded-xl p-5 space-y-3 shadow-md animate-pulse">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Aktív modell betanítás
                </span>
                <span>Epoch 3/5</span>
              </div>
              <h4 className="text-sm font-semibold">Tuning folyamatban: <span className="text-yellow-300 font-mono font-bold">{modelName}</span></h4>
              
              <div className="flex justify-between items-center text-xs mt-2">
                <span>Loss (Hibaarány): <span className="font-mono font-bold text-rose-300">{currentLoss.toFixed(4)}</span></span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="w-full bg-indigo-950 rounded-full h-2">
                <div className="bg-indigo-400 h-2 rounded-full transition-all duration-300" style={{ width: `${trainingProgress}%` }} />
              </div>
            </div>
          )}

          {/* Trained Models Database Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Már betanított saját modellek</h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {trainedModels.map((model) => (
                <div key={model.id} className="bg-white p-3 border border-slate-200 rounded-lg shadow-2xs flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 font-mono">tuning/{model.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Alapmodell: {model.baseModel} • Dataset: {model.datasetSize} rekord • Létrehozva: {model.dateCreated}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold uppercase rounded-full flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Használatra kész
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
