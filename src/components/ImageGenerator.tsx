import React, { useState } from 'react';
import { Image, Sparkles, Download, Eye, Loader, Check, Trash } from 'lucide-react';
import { ART_STYLES } from '../mockData';

interface ImageGeneratorProps {
  onAddLog: (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  ratio: string;
  engine: string;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onAddLog }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [ratio, setRatio] = useState('1:1');
  const [engine, setEngine] = useState('Gemini Neobanana Engine');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Default gallery items
  const [gallery, setGallery] = useState<GeneratedImage[]>([
    {
      id: 'g-1',
      url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      prompt: 'Colorful local organic vegetable market',
      style: 'Photorealistic',
      ratio: '4:3',
      engine: 'Gemini Neobanana'
    },
    {
      id: 'g-2',
      url: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=400&q=80',
      prompt: 'Minimalist creative workspace with a bamboo mug',
      style: 'Minimalist illustration',
      ratio: '16:9',
      engine: 'DALL-E 3'
    }
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Kérlek adj meg egy leíró promptot a kép generálásához!');
      return;
    }
    setIsGenerating(true);
    setPreviewImage(null);

    const styleName = ART_STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle;

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          artStyle: styleName,
          aspectRatio: ratio
        })
      });

      const data = await response.json();
      if (data.success && data.imageUrl) {
        setPreviewImage(data.imageUrl);

        // Add to gallery
        const newImg: GeneratedImage = {
          id: `img-${Date.now()}`,
          url: data.imageUrl,
          prompt,
          style: styleName,
          ratio,
          engine
        };
        setGallery([newImg, ...gallery]);

        onAddLog(
          `AI Képgenerálás: '${prompt}'`,
          engine === 'Gemini Neobanana Engine' ? 'gemini-3.1-flash-lite-image' : 'dall-e-3',
          prompt.length,
          0,
          0,
          0.0015
        );
      } else {
        throw new Error(data.error || 'Nincs kép adat.');
      }
    } catch (e: any) {
      console.error(e);
      // Fallback image using dynamic picsum seed matching art theme!
      const seedName = prompt.replace(/\s+/g, '-').substring(0, 15);
      const simulatedUrl = `https://picsum.photos/seed/${seedName}/600/600`;
      
      setPreviewImage(simulatedUrl);

      const newImg: GeneratedImage = {
        id: `img-${Date.now()}`,
        url: simulatedUrl,
        prompt,
        style: styleName,
        ratio,
        engine: `${engine} (Szimulált)`
      };
      setGallery([newImg, ...gallery]);

      onAddLog(
        `AI Képgenerálás (Szimulált): '${prompt}'`,
        'gemini-3.1-flash-lite-image',
        prompt.length,
        0,
        0,
        0
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFromGallery = (id: string) => {
    setGallery(gallery.filter(item => item.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Image className="text-indigo-600 w-6 h-6" />
          <span>Művészi Képgenerátor</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Generálj kiemelt képeket, illusztrációkat és termékfotókat bejegyzéseidhez.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings and trigger */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Írd le a generálandó képet (Prompt)</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pl.: Egy modern minimalista iroda bambusz bútorokkal, napfényes skandináv stílus, fotórealisztikus..."
              className="w-full p-3 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-850"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Művészi stílus (Art Styles)</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs text-slate-700 bg-white"
            >
              {ART_STYLES.map((st) => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Képarány (Aspect Ratio)</label>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-250 rounded-lg text-xs text-slate-700 bg-white"
              >
                <option value="1:1">1:1 (Kocka)</option>
                <option value="16:9">16:9 (Kiemelt kép banner)</option>
                <option value="9:16">9:16 (Álló mobil)</option>
                <option value="4:3">4:3 (Kártya / Cikk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">AI Képgeneráló Motor</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-250 rounded-lg text-xs text-slate-700 bg-white"
              >
                <option value="Gemini Neobanana Engine">Gemini Neobanana (Gyors)</option>
                <option value="DALL-E 3">DALL-E 3 (Részletes)</option>
                <option value="Stable Diffusion XL">Stable Diffusion (Művészi)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Kép generálása folyamatban...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  AI Kép Generálása
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live generated preview */}
        <div className="lg:col-span-2 flex flex-col justify-between border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-500" />
              Legutóbbi Generált Kép
            </span>
            <span className="text-[10px] text-slate-400 font-mono">featured-image-preview.png</span>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 min-h-[250px]">
            {isGenerating ? (
              <div className="text-center space-y-2">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Művészi kompozíció kiszámítása...</p>
              </div>
            ) : previewImage ? (
              <div className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src={previewImage}
                  alt="Generált kép"
                  referrerPolicy="no-referrer"
                  className="max-h-[300px] object-contain mx-auto"
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <a
                    href={previewImage}
                    download="wordpress-ai-image.png"
                    className="p-2 bg-white hover:bg-slate-100 rounded-full text-slate-800 transition shadow"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 p-8 space-y-2">
                <Image className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs">Nincs aktív kép előnézet. Adj meg egy promptot, válaszd ki a stílust és kattints a generálásra.</p>
              </div>
            )}
          </div>

          {previewImage && (
            <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center px-4">
              <span className="text-[11px] text-slate-500 italic">Méretezés: 1024x1024 px ({ratio})</span>
              <button
                onClick={() => alert('Kép sikeresen beállítva a WordPress bejegyzés kiemelt képeként!')}
                className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Beállítás kiemelt képként
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Section */}
      <div className="border-t border-slate-100 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Generált Képek Galériája</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group relative shadow-2xs">
              <img
                src={item.url}
                alt={item.prompt}
                referrerPolicy="no-referrer"
                className="w-full h-36 object-cover"
              />
              <div className="p-2.5">
                <h4 className="text-xs font-bold text-slate-800 truncate" title={item.prompt}>{item.prompt}</h4>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{item.style}</span>
                  <button
                    onClick={() => deleteFromGallery(item.id)}
                    className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
