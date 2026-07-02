import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Check, Loader, RefreshCw, Eye, Edit3, ArrowRight } from 'lucide-react';
import { WPProduct } from '../types';

interface WooCommerceProps {
  products: WPProduct[];
  onUpdateProduct: (product: WPProduct) => void;
  onAddLog: (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => void;
}

export const WooCommerceAI: React.FC<WooCommerceProps> = ({ products, onUpdateProduct, onAddLog }) => {
  const [selectedProduct, setSelectedProduct] = useState<WPProduct | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [keywords, setKeywords] = useState('');
  
  // Form fields for editing/optimizing
  const [optTitle, setOptTitle] = useState('');
  const [optDesc, setOptDesc] = useState('');
  const [optShortDesc, setOptShortDesc] = useState('');

  const [activeTab, setActiveTab] = useState<'desc' | 'short'>('desc');
  const [isSyncingWp, setIsSyncingWp] = useState(false);

  const openOptimizeDrawer = (prod: WPProduct) => {
    setSelectedProduct(prod);
    setKeywords(prod.keywords.join(', '));
    setOptTitle(prod.title);
    setOptDesc(prod.description);
    setOptShortDesc(prod.shortDescription);
  };

  const handleOptimize = async () => {
    if (!selectedProduct) return;
    setIsOptimizing(true);

    try {
      const response = await fetch('/api/ai/optimize-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedProduct.title,
          description: selectedProduct.description,
          category: 'Kiegészítők',
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      });

      const data = await response.json();
      if (data.success) {
        setOptTitle(data.optimizedTitle);
        setOptDesc(data.optimizedDescription);
        setOptShortDesc(data.optimizedShortDescription);

        onAddLog(
          `WooCommerce Termék optimalizálás: '${selectedProduct.title}'`,
          'gemini-3.5-flash',
          selectedProduct.title.length + selectedProduct.description.length,
          data.optimizedDescription.length,
          800,
          0.0001
        );
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error(e);
      // Fallback optimized data
      const simulatedTitle = `[SEO] Prémium ${selectedProduct.title} - Fenntartható dizájn`;
      const simulatedDesc = `<h2>Miért válaszd a(z) ${selectedProduct.title} terméket?</h2><p>A legmagasabb minőségi elvárásoknak megfelelően tervezett kiegészítő, amely tökéletesen ötvözi a funkciót és az esztétikát. Kiemelkedő tartósság, környezetbarát megközelítés.</p><ul><li>Prémium, válogatott alapanyagok</li><li>Hosszú élettartam és megbízhatóság</li><li>Elegáns, modern dizájn</li></ul>`;
      const simulatedShortDesc = `Optimalizált prémium kiadás. Szuperkényelmes, környezetbarát és rendkívül tartós választás a mindennapokra. Rendeld meg ma!`;

      setOptTitle(simulatedTitle);
      setOptDesc(simulatedDesc);
      setOptShortDesc(simulatedShortDesc);

      onAddLog(
        `WooCommerce Termék optimalizálás (Szimulált): '${selectedProduct.title}'`,
        'gemini-3.5-flash',
        selectedProduct.title.length,
        simulatedDesc.length,
        0,
        0
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) return;

    const wpUrl = localStorage.getItem('wp_site_url');
    const wpToken = localStorage.getItem('wp_sync_token');
    
    let livePublishSuccess = false;
    let livePermalink = '';

    if (wpUrl && wpToken) {
      setIsSyncingWp(true);
      try {
        const payload = {
          title: optTitle,
          description: optDesc,
          short_description: optShortDesc,
          price: selectedProduct.price,
          sku: selectedProduct.sku || `SKU-${selectedProduct.id}`,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          image_url: selectedProduct.image,
          status: 'publish'
        };

        const res = await fetch(`${wpUrl}/wp-json/wp-ai-suite/v1/publish-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wpToken}`
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.success || res.ok) {
          livePublishSuccess = true;
          livePermalink = result.permalink || '';
        }
      } catch (err) {
        console.error("WooCommerce live publishing failed:", err);
      } finally {
        setIsSyncingWp(false);
      }
    }

    const updated: WPProduct = {
      ...selectedProduct,
      title: optTitle,
      description: optDesc,
      shortDescription: optShortDesc,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      status: 'publish' // auto publish upon optimization
    };

    onUpdateProduct(updated);
    setSelectedProduct(null);

    if (livePublishSuccess) {
      alert(`Sikeres szinkronizáció! A termék feltöltve a WooCommerce áruházadba: ${livePermalink || wpUrl}`);
      onAddLog(`Sikeres WooCommerce termék szinkronizáció: ${optTitle}`, 'REST API', 0, 0, 0, 0);
    } else if (wpUrl && wpToken) {
      alert(`Termék frissítve a helyi listában, de a WooCommerce szinkronizáció meghiúsult (CORS korlátozás vagy érvénytelen kulcs miatt).`);
    } else {
      alert('Termék sikeresen frissítve a helyi listában! Élő WooCommerce áruházba történő feltöltéshez töltsd le és konfiguráld a plugint a "WordPress Integráció" menüpontban!');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="text-emerald-500 w-6 h-6" />
          <span>WooCommerce AI Termék Optimalizáló</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Optimalizáld termékeid címeit, hosszú és rövid leírásait keresőmotorokra és értékesítésre.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aktív WooCommerce Termékek</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {products.map((prod) => (
              <div key={prod.id} className="p-4 hover:bg-slate-50/50 transition flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={prod.image}
                    alt={prod.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover bg-slate-150 border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{prod.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{prod.shortDescription}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {prod.keywords.map((k) => (
                        <span key={k} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/60 rounded text-[9px] text-slate-500 font-semibold uppercase">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900">{parseFloat(prod.price).toLocaleString()} Ft</span>
                  <button
                    onClick={() => openOptimizeDrawer(prod)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Optimalizálás
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Instructions info panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 h-fit">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Szemantikus optimalizáció
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Az AI elemzi a terméked jelenlegi adatait, és az általad megadott fókusz kulcsszavak alapján átdolgozza a vásárlói élményt:
          </p>
          <ul className="text-[11px] text-slate-500 space-y-2 list-disc pl-4">
            <li><strong>SEO Cím:</strong> Magas kattintási arányú, keresőbarát felépítés.</li>
            <li><strong>Rövid Leírás:</strong> Azonnali vásárlói előnyökre hangolt 2-3 mondatos összefoglaló bullet-pointokkal.</li>
            <li><strong>Hosszú Leírás:</strong> Részletes, HTML listákkal tagolt, formázott bemutató szöveg.</li>
          </ul>
        </div>
      </div>

      {/* Split Optimize Drawer / Modal if active */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-indigo-400 w-5 h-5" />
                <h3 className="text-base font-bold">Termék optimalizálása: {selectedProduct.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                Bezárás
              </button>
            </div>

            {/* Drawer Body - Split Screen comparison */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 divide-x divide-slate-100">
              {/* Left Side: Original & Configuration */}
              <div className="space-y-4 pr-3">
                <div className="inline-flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 text-xs font-bold">
                  <span>Eredeti termék adatok</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Eredeti Terméknév</label>
                  <p className="p-2 border border-slate-200 rounded bg-slate-50/50 text-xs text-slate-800 font-semibold">{selectedProduct.title}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Célzott SEO Kulcsszavak</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="bambusz kiegészítő, tartós asztalrendező"
                    className="w-full p-2 border border-slate-250 rounded text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Kulcsszavak, amelyeket az AI beépít a leírásba</span>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Optimalizálás folyamatban...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                        AI Optimalizáció Futtatása
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Side: AI Output Preview */}
              <div className="space-y-4 pl-6">
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-emerald-800 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI Optimalizált verzió</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Optimális SEO Terméknév</label>
                  <input
                    type="text"
                    value={optTitle}
                    onChange={(e) => setOptTitle(e.target.value)}
                    className="w-full p-2 border border-slate-250 rounded text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  {/* Tabs for long and short description preview */}
                  <div className="flex border-b border-slate-200 mb-2">
                    <button
                      onClick={() => setActiveTab('desc')}
                      className={`px-3 py-1.5 text-xs font-bold border-b-2 transition ${activeTab === 'desc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
                    >
                      Hosszú leírás
                    </button>
                    <button
                      onClick={() => setActiveTab('short')}
                      className={`px-3 py-1.5 text-xs font-bold border-b-2 transition ${activeTab === 'short' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
                    >
                      Rövid leírás
                    </button>
                  </div>

                  {activeTab === 'desc' ? (
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-semibold uppercase">HTML Forráskód / Előnézet</label>
                      <textarea
                        rows={10}
                        value={optDesc}
                        onChange={(e) => setOptDesc(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-semibold uppercase">Szöveges Összefoglaló</label>
                      <textarea
                        rows={6}
                        value={optShortDesc}
                        onChange={(e) => setOptShortDesc(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-slate-50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Mégse
              </button>
              <button
                onClick={handleSave}
                disabled={isSyncingWp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSyncingWp ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Feltöltés...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Módosítások mentése és feltöltése
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
