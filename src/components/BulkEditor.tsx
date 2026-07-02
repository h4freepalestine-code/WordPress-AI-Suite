import React, { useState } from 'react';
import { Database, FileSpreadsheet, Clipboard, Sparkles, Loader, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { WPPost } from '../types';

interface BulkEditorProps {
  onAddPosts: (posts: WPPost[]) => void;
  onAddLog: (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => void;
}

export const BulkEditor: React.FC<BulkEditorProps> = ({ onAddPosts, onAddLog }) => {
  const [activeMode, setActiveMode] = useState<'titles' | 'csv' | 'paste'>('titles');
  const [isPremium, setIsPremium] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentGeneratingTitle, setCurrentGeneratingTitle] = useState('');

  // Mode 1: Direct Titles
  const [directTitles, setDirectTitles] = useState<string[]>([
    'A zöld otthoni iroda berendezése',
    'A memóriahabos párnák titkai',
    'A legújabb technológiai trendek 2026-ban',
    '',
    ''
  ]);

  // Mode 2: CSV Mock Data
  const [csvContent, setCsvContent] = useState<string>(
    "Cím,Kategória,Kulcsszavak\n" +
    "Bambusz termékek előnyei,Környezetvédelem,\"bambusz, zöld\"\n" +
    "Ergonomikus ülőmunka tippek,Egészség,\"ergonómia, ülőmunka\"\n" +
    "Hogyan legyél produktív otthonról,Életmód,\"produktivitás, otthoni munka\"\n" +
    "A mesterséges intelligencia jövője,Technológia,\"ai, jövő\"\n" +
    "WooCommerce webshop indítása,E-kereskedelem,\"woocommerce, webshop\""
  );

  // Mode 3: Copy-Paste
  const [pasteContent, setPasteContent] = useState<string>(
    "Minőségi alvás jelentősége a munkában\n" +
    "Miért válassz bambusz kiegészítőket?\n" +
    "Hogyan csökkentsük a munkahelyi stresszt"
  );

  const handleTitleChange = (idx: number, val: string) => {
    const list = [...directTitles];
    list[idx] = val;
    setDirectTitles(list);
  };

  const addTitleField = () => {
    if (!isPremium && directTitles.length >= 5) {
      alert('Az ingyenes verzióban legfeljebb 5 címet generálhatsz egyszerre. Frissíts prémiumra a korlátlan tömeges feltöltéshez!');
      return;
    }
    setDirectTitles([...directTitles, '']);
  };

  const handleBulkGenerate = async () => {
    let titlesToGenerate: string[] = [];

    if (activeMode === 'titles') {
      titlesToGenerate = directTitles.filter(t => t.trim() !== '');
    } else if (activeMode === 'csv') {
      const rows = csvContent.split('\n').slice(1); // skip header
      titlesToGenerate = rows.map(r => r.split(',')[0]?.trim()).filter(Boolean);
    } else if (activeMode === 'paste') {
      titlesToGenerate = pasteContent.split('\n').map(t => t.trim()).filter(Boolean);
    }

    if (titlesToGenerate.length === 0) {
      alert('Kérlek adj meg legalább egy érvényes címet!');
      return;
    }

    // Limit check for non-premium
    if (!isPremium && titlesToGenerate.length > 5) {
      alert(`Az ingyenes csomagban egyszerre maximum 5 cikket generálhatsz. Jelenleg ${titlesToGenerate.length} cikket szeretnél. Kérlek csökkentsd a darabszámot vagy válts Prémiumra!`);
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const generatedPosts: WPPost[] = [];

    // Staggered generation simulation
    for (let i = 0; i < titlesToGenerate.length; i++) {
      const t = titlesToGenerate[i];
      setCurrentGeneratingTitle(t);
      
      // wait 1 second per item to show beautiful real-time progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPost: WPPost = {
        id: `post-bulk-${Date.now()}-${i}`,
        title: t,
        excerpt: `Tömegesen generált SEO-barát cikk a(z) ${t} témájában.`,
        content: `<h2>Bevezetés a(z) ${t} témakörébe</h2><p>Ez a tartalom a Tömeges Cikkíró (Bulk Editor) modul segítségével jött létre automatikusan. A bejegyzés készen áll a finomhangolásra és a WordPress publikálásra.</p><h2>Miért fontos ez?</h2><p>A(z) ${t} napjaink egyik kiemelkedően fontos témája, amely sokakat érint mind magánéletben, mind üzleti környezetben.</p>`,
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        author: 'AI Bulk Engine',
        category: 'Tömeges Generálás',
        keywords: [t.toLowerCase().substring(0, 15)],
        images: ['https://picsum.photos/seed/bulk/800/600']
      };

      generatedPosts.push(newPost);
      setProgress(Math.round(((i + 1) / titlesToGenerate.length) * 100));
    }

    onAddPosts(generatedPosts);
    onAddLog(
      `Tömeges cikk generálás: ${titlesToGenerate.length} db cikk`,
      'gemini-3.5-flash',
      titlesToGenerate.join(' ').length,
      generatedPosts.reduce((sum, p) => sum + p.content.length, 0),
      titlesToGenerate.length * 400,
      titlesToGenerate.length * 0.0001
    );

    setIsGenerating(false);
    alert(`Sikeresen legeneráltunk ${titlesToGenerate.length} cikket, és elmentettük őket a piszkozatok közé!`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="text-amber-500 w-6 h-6" />
          <span>Tömeges Szerkesztő (Bulk Editor - Multiprocess)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Hozz létre tucatnyi bejegyzést vagy oldalt egyszerre, másodpercek alatt.</p>
      </div>

      {/* Free Plan Notification */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${isPremium ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPremium ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {isPremium ? 'Prémium Csomag Aktív' : 'Ingyenes AI Csomag limitáció'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {isPremium 
                ? 'Korlátlan tömeges cikkgenerálás, ütemezés és Google Táblázat integráció engedélyezve.' 
                : 'Az ingyenes csomagban egyszerre maximum 5 cikket generálhatsz. Frissíts a korlátlan generáláshoz.'}
            </p>
          </div>
        </div>
        {!isPremium && (
          <button
            onClick={() => {
              setIsPremium(true);
              alert('Sikeresen aktiváltad a WordPress AI Suite Prémium funkcióit! (Szimuláció)');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
          >
            Frissítés Prémiumra
          </button>
        )}
      </div>

      {/* Mode Selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveMode('titles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${activeMode === 'titles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Sparkles className="w-4 h-4" />
          Címek közvetlen megadása
        </button>
        <button
          onClick={() => setActiveMode('csv')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${activeMode === 'csv' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Feltöltés CSV-ből
        </button>
        <button
          onClick={() => setActiveMode('paste')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${activeMode === 'paste' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Clipboard className="w-4 h-4" />
          Másolás-beillesztés
        </button>
      </div>

      {/* Mode contents */}
      {activeMode === 'titles' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Írd be a kívánt cikkek címeit. Az AI különálló, teljes értékű bejegyzés piszkozatokat fog létrehozni mindegyikből.</p>
          <div className="space-y-2 max-w-xl">
            {directTitles.map((title, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(idx, e.target.value)}
                  placeholder={`Pl.: Cikk címe ${idx + 1}`}
                  className="flex-1 px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addTitleField}
            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
          >
            + Új cím hozzáadása
          </button>
        </div>
      )}

      {activeMode === 'csv' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Másold be vagy írd be a CSV formátumú adataidat az alábbi mezőbe.</p>
            <button
              onClick={() => {
                setCsvContent(
                  "Cím,Kategória,Kulcsszavak\n" +
                  "A legfinomabb kávébabok lelőhelyei,Gasztronómia,\"kávé, gourmet\"\n" +
                  "Top 5 utazási célpont idén,Utazás,\"utazás, nyaralás\"\n" +
                  "Hogyan működik a SEO?,Technológia,\"seo, marketing\""
                );
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              Minta CSV betöltése
            </button>
          </div>
          <textarea
            rows={6}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="w-full p-3 font-mono text-xs border border-slate-250 rounded-lg bg-slate-50"
          />
        </div>
      )}

      {activeMode === 'paste' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Másolj be egy listát ide. Minden új sor egy különálló cikk címe lesz.</p>
          <textarea
            rows={6}
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Kovácsolás alapjai&#10;Hogyan legyünk fittek?&#10;Bambusz az otthonomban"
            className="w-full p-3 text-xs border border-slate-250 rounded-lg"
          />
        </div>
      )}

      {/* Progress and status */}
      {isGenerating && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-700 font-bold">
            <span className="flex items-center gap-1.5">
              <Loader className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              Generálás alatt: <span className="text-indigo-600">{currentGeneratingTitle}</span>
            </span>
            <span>{progress}% kész</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Action Button */}
      {!isGenerating && (
        <div className="flex justify-end">
          <button
            onClick={handleBulkGenerate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5" />
            Tömeges Generálás Indítása
          </button>
        </div>
      )}
    </div>
  );
};
