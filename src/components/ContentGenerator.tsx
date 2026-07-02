import React, { useState } from 'react';
import { FileText, Sparkles, Plus, Trash, ArrowUp, ArrowDown, HelpCircle, Eye, Edit, Save, ArrowLeft, Image, Loader } from 'lucide-react';
import { MOCK_LANGUAGES, MOCK_STYLES, MOCK_TONES, ART_STYLES } from '../mockData';
import { WPPost } from '../types';

interface ContentGeneratorProps {
  onAddPost: (post: WPPost) => void;
  onAddLog: (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => void;
  hasApiKey: boolean;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({ onAddPost, onAddLog, hasApiKey }) => {
  // Wizard steps
  const [step, setStep] = useState<'configure' | 'outline' | 'generating' | 'preview'>('configure');

  // Generation parameters
  const [title, setTitle] = useState('');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  
  const [language, setLanguage] = useState('Magyar');
  const [style, setStyle] = useState('informative');
  const [tone, setTone] = useState('professional');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1500);
  const [topP, setTopP] = useState(0.9);

  // Outline
  const [headings, setHeadings] = useState<string[]>([
    'Bevezetés a témába',
    'Főbb elméleti alapok',
    'Gyakorlati tippek és megvalósítás',
    'Gyakori hibák, amiket kerülj el',
    'Összegzés és jövőbeli kilátások'
  ]);
  const [newHeading, setNewHeading] = useState('');

  // Premium / advanced options
  const [keywords, setKeywords] = useState<string>('');
  const [avoidKeywords, setAvoidKeywords] = useState<string>('');
  const [makeKeywordsBold, setMakeKeywordsBold] = useState(false);
  const [autoGenerateKeywords, setAutoGenerateKeywords] = useState(true);
  const [autoInsertKeywords, setAutoInsertKeywords] = useState(true);
  const [generatingKeywords, setGeneratingKeywords] = useState(false);
  const [addQa, setAddQa] = useState(false);
  const [addCta, setAddCta] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('Iratkozz fel hírlevelünkre!');
  const [ctaUrl, setCtaUrl] = useState('https://weboldalad.hu/cta');
  const [introCustomText, setIntroCustomText] = useState('');
  const [outroCustomText, setOutroCustomText] = useState('');
  const [isSyncingWp, setIsSyncingWp] = useState(false);

  // Generated results
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedExcerpt, setGeneratedExcerpt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Suggestions for titles helper
  const handleSuggestTitles = async () => {
    if (!title.trim()) {
      alert('Kérlek írj be egy alap témát a Cím mezőbe a javaslatokhoz!');
      return;
    }
    setLoadingTitles(true);
    try {
      const response = await fetch('/api/ai/suggest-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: title, type: 'post' })
      });
      const data = await response.json();
      if (data.success && data.titles) {
        setSuggestedTitles(data.titles);
      } else {
        // Fallback title list if API fails or no key
        setSuggestedTitles([
          `${title} - Kezdők Útmutatója`,
          `Hogyan győzd le a kihívásokat itt: ${title}?`,
          `A legfontosabb titkok erről: ${title}`,
          `10 dolog, amit senki nem mond el a(z) ${title} kapcsán`,
          `${title} a modern korban: tippek és trükkök`
        ]);
      }
    } catch (e) {
      setSuggestedTitles([
        `${title} - Kezdők Útmutatója`,
        `Hogyan győzd le a kihívásokat itt: ${title}?`,
        `A legfontosabb titkok erről: ${title}`
      ]);
    } finally {
      setLoadingTitles(false);
    }
  };

  const handleGenerateKeywordsIndependently = async () => {
    if (!title.trim()) {
      alert('Kérlek írj be egy címet vagy témát először a kulcsszó generáláshoz!');
      return;
    }
    setGeneratingKeywords(true);
    try {
      const response = await fetch('/api/ai/generate-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, language })
      });
      const data = await response.json();
      if (data.success && data.keywords) {
        setKeywords(data.keywords.join(', '));
      }
    } catch (err) {
      console.error(err);
      const fallbackList = title.split(/\s+/)
        .map(w => w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim())
        .filter(w => w.length > 3)
        .slice(0, 6);
      setKeywords(fallbackList.join(', '));
    } finally {
      setGeneratingKeywords(false);
    }
  };

  // Heading functions
  const addHeading = () => {
    if (newHeading.trim()) {
      setHeadings([...headings, newHeading.trim()]);
      setNewHeading('');
    }
  };

  const deleteHeading = (index: number) => {
    setHeadings(headings.filter((_, i) => i !== index));
  };

  const moveHeading = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= headings.length) return;
    const list = [...headings];
    const temp = list[index];
    list[index] = list[nextIndex];
    list[nextIndex] = temp;
    setHeadings(list);
  };

  // Trigger main content generation
  const handleGenerate = async () => {
    if (!title.trim()) {
      setErrorMsg('A bejegyzés címe nem lehet üres!');
      return;
    }
    setErrorMsg('');
    setIsGenerating(true);
    setStep('generating');

    const splitKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const splitAvoid = avoidKeywords.split(',').map(k => k.trim()).filter(Boolean);

    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          language,
          headings,
          temperature,
          maxTokens,
          topP,
          tone,
          style,
          keywords: splitKeywords,
          avoidKeywords: splitAvoid,
          makeKeywordsBold,
          addQa,
          addCta,
          ctaLabel,
          ctaUrl,
          introCustomText,
          outroCustomText
        })
      });

      const data = await response.json();
      if (data.success && data.html) {
        let finalHtml = data.html;
        if (data.generatedKeywords && data.generatedKeywords.length > 0) {
          if (autoGenerateKeywords) {
            setKeywords(data.generatedKeywords.join(', '));
          }
          if (autoInsertKeywords) {
            const tagsHtml = `
              <div class="wp-block-ai-suite-tags mt-8 pt-4 border-t border-slate-200">
                <p style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">Címkék & Kulcsszavak:</p>
                <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${data.generatedKeywords.map((k: string) => `
                    <span class="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-indigo-150 mr-1.5 my-1" style="display: inline-block; background-color: #f5f3ff; color: #4f46e5; border: 1px solid #ddd6fe; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-decoration: none; margin-right: 6px;">#${k}</span>
                  `).join('')}
                </div>
              </div>
            `;
            finalHtml += tagsHtml;
          }
        }
        
        setGeneratedContent(finalHtml);
        setGeneratedExcerpt(data.excerpt);
        
        // Add log
        onAddLog(
          `Cikk generálása: '${title}'`,
          'gemini-3.5-flash',
          title.length + headings.join(' ').length,
          finalHtml.length,
          Math.floor(finalHtml.length / 3),
          0.0003
        );
        
        setStep('preview');
      } else {
        throw new Error(data.error || 'Ismeretlen hiba történt a generálás során.');
      }
    } catch (e: any) {
      console.error(e);
      
      const fallbackTags = title.split(/\s+/)
        .map(w => w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim())
        .filter(w => w.length > 3)
        .slice(0, 6);
      
      if (autoGenerateKeywords) {
        setKeywords(fallbackTags.join(', '));
      }

      // Fallback generator for beautiful demo even if API key is not connected/valid
      let simulatedHtml = `
        <p><em>(Megjegyzés: Ez egy szimulált magas minőségű WordPress bejegyzés, mert a Gemini API hiba üzenetet küldött: "${e.message || 'Hiányzó API kulcs'}". Adj meg egy működő kulcsot a beállításokban a valós generáláshoz.)</em></p>
        <h2>Bevezetés: ${title}</h2>
        <p>A mai modern világban a(z) <strong>${title}</strong> egyre fontosabb szerepet játszik. Sokan kutatják ezt a területet, de kevesen értik meg a mélyebb összefüggéseket.</p>
        ${headings.map(h => `<h2>${h}</h2><p>Ez a szakasz a(z) <strong>${title}</strong> cikk vázlatából épül fel, kifejezetten a(z) <em>${h}</em> témára fókuszálva. A legfontosabb szempontok részletezése és a kulcsfontosságú gondolatok ábrázolása történik meg ebben a bekezdésben.</p>`).join('\n')}
        ${addQa ? `
        <h2>Gyakran Ismételt Kérdések (GYIK)</h2>
        <h3>Mi a(z) ${title} legfőbb előnye?</h3>
        <p>A válasz az egyszerűségben és a hatékonyságban rejlik. Lehetővé teszi, hogy időt takaríts meg és optimális eredményt érj el.</p>
        ` : ''}
        ${addCta ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5; margin-top: 20px; text-align: center;">
          <h4 style="margin: 0 0 10px 0; font-weight: bold;">Készen állsz a következő lépésre?</h4>
          <p style="margin: 0 0 15px 0; font-size: 14px;">Növeld a hatékonyságod még ma!</p>
          <a href="${ctaUrl}" style="background-color: #4f46e5; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">${ctaLabel}</a>
        </div>
        ` : ''}
      `;

      if (autoInsertKeywords && fallbackTags.length > 0) {
        simulatedHtml += `
          <div class="wp-block-ai-suite-tags mt-8 pt-4 border-t border-slate-200">
            <p style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">Címkék & Kulcsszavak:</p>
            <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${fallbackTags.map(k => `
                <span class="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-indigo-150 mr-1.5 my-1" style="display: inline-block; background-color: #f5f3ff; color: #4f46e5; border: 1px solid #ddd6fe; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-decoration: none; margin-right: 6px;">#${k}</span>
              `).join('')}
            </div>
          </div>
        `;
      }

      setGeneratedContent(simulatedHtml);
      setGeneratedExcerpt(`Részletes és átfogó szakmai bejegyzés a(z) ${title} témájában, lépésről lépésre követhető tippekkel.`);
      
      // Still log but mark as free or small cost
      onAddLog(
        `Cikk generálása (Szimulált): '${title}'`,
        'gemini-3.5-flash',
        title.length,
        simulatedHtml.length,
        0,
        0
      );
      setStep('preview');
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish to simulated WordPress db or real WordPress
  const handlePublish = async (status: 'draft' | 'publish') => {
    const wpUrl = localStorage.getItem('wp_site_url');
    const wpToken = localStorage.getItem('wp_sync_token');
    
    let livePublishSuccess = false;
    let livePermalink = '';

    if (wpUrl && wpToken) {
      setIsSyncingWp(true);
      try {
        const payload = {
          title,
          content: generatedContent,
          excerpt: generatedExcerpt,
          status,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          featured_image: 'https://picsum.photos/seed/wpai/800/600',
          category: 'Generált tartalom'
        };

        const res = await fetch(`${wpUrl}/wp-json/wp-ai-suite/v1/publish-post`, {
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
        console.error("WordPress live publishing failed:", err);
      } finally {
        setIsSyncingWp(false);
      }
    }

    const newPost: WPPost = {
      id: `post-${Date.now()}`,
      title,
      excerpt: generatedExcerpt,
      content: generatedContent,
      date: new Date().toISOString().split('T')[0],
      status,
      author: 'Admin AI',
      category: 'Generált tartalom',
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      images: ['https://picsum.photos/seed/wpai/800/600']
    };

    onAddPost(newPost);

    if (livePublishSuccess) {
      alert(`Sikeres szinkronizáció! A cikk közzétéve a WordPress oldalon: ${livePermalink || wpUrl}`);
      onAddLog(`Sikeres cikk szinkronizáció: ${title}`, 'REST API', 0, 0, 0, 0);
    } else if (wpUrl && wpToken) {
      alert(`A helyi adatbázisba elmentve, de a WordPress szinkronizáció meghiúsult (CORS korlátozás vagy érvénytelen adatok miatt. Ellenőrizd a beállításokat!)`);
    } else {
      alert(status === 'publish' ? 'Cikk sikeresen elmentve a helyi listába! Élő WordPress szinkronizációhoz töltsd le és konfiguráld a plugint a "WordPress Integráció" menüpontban!' : 'Cikk elmentve a helyi piszkozatok közé!');
    }

    // Reset
    setTitle('');
    setHeadings([
      'Bevezetés a témába',
      'Főbb elméleti alapok',
      'Gyakorlati tippek és megvalósítás',
      'Gyakori hibák, amiket kerülj el',
      'Összegzés és jövőbeli kilátások'
    ]);
    setStep('configure');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
      {/* Header with back actions if preview */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-indigo-600 w-6 h-6" />
            <span>Szuper Cikkíró (Singe-view Content Generator)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Generálj profi bejegyzéseket és oldalakat a legfejlettebb nyelvi modellekkel.</p>
        </div>
        {step === 'preview' && (
          <button
            onClick={() => setStep('configure')}
            className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium text-xs border border-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Vissza a szerkesztőhöz
          </button>
        )}
      </div>

      {step === 'configure' && (
        <div className="space-y-6">
          {/* Main settings row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Topic */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  A cikk címe vagy fő témája <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Pl.: Hogyan tanuljunk meg kódolni 2026-ban?"
                    className="flex-1 px-3.5 py-2 border border-slate-250 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSuggestTitles}
                    disabled={loadingTitles}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-indigo-200 transition shrink-0"
                  >
                    {loadingTitles ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Címjavaslatok
                  </button>
                </div>
              </div>

              {/* suggested titles dropdown list if any */}
              {suggestedTitles.length > 0 && (
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-3 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">AI javasolt SEO címek</span>
                    <button onClick={() => setSuggestedTitles([])} className="text-[10px] text-slate-400 hover:text-slate-600">Mégse</button>
                  </div>
                  {suggestedTitles.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTitle(t);
                        setSuggestedTitles([]);
                      }}
                      className="w-full text-left text-xs text-slate-700 hover:text-indigo-600 py-1 px-2 hover:bg-indigo-50 rounded transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Outlines List before moving to step */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span>Cikk vázlata (Alfejezetek / Headings)</span>
                  <span className="text-xs font-normal text-slate-500">Add meg, töröld vagy rendezd át a címsorokat</span>
                </label>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[300px] overflow-y-auto bg-slate-50/50 p-2 space-y-1.5">
                  {headings.map((heading, index) => (
                    <div key={index} className="flex items-center justify-between bg-white px-3 py-2 border border-slate-200/80 rounded-md shadow-2xs">
                      <span className="text-xs text-slate-700 font-medium">{heading}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveHeading(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveHeading(index, 'down')}
                          disabled={index === headings.length - 1}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteHeading(index)}
                          className="p-1 text-slate-400 hover:text-rose-500 ml-1"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHeading}
                    onChange={(e) => setNewHeading(e.target.value)}
                    placeholder="Új alfejezet címe..."
                    className="flex-1 px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
                    onKeyDown={(e) => { if (e.key === 'Enter') addHeading(); }}
                  />
                  <button
                    onClick={addHeading}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Hozzáad
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Parameters Panel */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Generálási Beállítások</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Célnyelv (Language)</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-250 rounded-md text-xs text-slate-700 bg-white"
                >
                  {MOCK_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Stílus (Style)</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-250 rounded-md text-xs text-slate-700 bg-white"
                  >
                    {MOCK_STYLES.map((st) => (
                      <option key={st.id} value={st.id}>{st.label.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hangvétel (Tone)</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-250 rounded-md text-xs text-slate-700 bg-white"
                  >
                    {MOCK_TONES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Hőmérséklet (Temp)</span>
                  <span className="text-slate-500 font-semibold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Maximális tokenek</span>
                  <span className="text-slate-500 font-semibold">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Advanced options expander (Keywords, CTA, intros/outros) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Speciális és PRÉMIUM beállítások</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Kulcsszavak hozzáadása (Keywords - vesszővel elválasztva)</span>
                  <button
                    onClick={handleGenerateKeywordsIndependently}
                    disabled={generatingKeywords}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    {generatingKeywords ? <Loader className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generálás AI-val
                  </button>
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Pl.: marketing tippek, e-kereskedelem, hatékonyság"
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs text-slate-800"
                />
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoGenerateKeywords"
                      checked={autoGenerateKeywords}
                      onChange={(e) => setAutoGenerateKeywords(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="autoGenerateKeywords" className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <span>Automatikus kulcsszó és tag generálás cikkíráshoz</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">AJÁNLOTT</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoInsertKeywords"
                      checked={autoInsertKeywords}
                      onChange={(e) => setAutoInsertKeywords(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="autoInsertKeywords" className="text-xs text-slate-600 font-medium">
                      Címkék automatikus beillesztése a cikk végére (HTML formátumban)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="makeKeywordsBold"
                      checked={makeKeywordsBold}
                      onChange={(e) => setMakeKeywordsBold(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="makeKeywordsBold" className="text-xs text-slate-600 font-medium">
                      Kulcsszavak félkövérré tétele a szövegben <span className="text-indigo-600 text-[10px] uppercase font-bold bg-indigo-50 px-1 py-0.5 rounded ml-1">PRÉMIUM</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Elkerülendő kulcsszavak (Avoiding keywords)
                </label>
                <input
                  type="text"
                  value={avoidKeywords}
                  onChange={(e) => setAvoidKeywords(e.target.value)}
                  placeholder="Pl.: olcsó, reklám, ingyenes"
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  A Gemini modell megpróbálja elkerülni ezeket a szavakat. <span className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">PRÉMIUM</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
              {/* Intro / Outro Guides */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Egyedi bevezető fókusz (Intro Customizer)</label>
                <input
                  type="text"
                  value={introCustomText}
                  onChange={(e) => setIntroCustomText(e.target.value)}
                  placeholder="Pl. indítson egy vicces statisztikával vagy személyes történettel"
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Egyedi befejezés fókusz (Outro Customizer)</label>
                <input
                  type="text"
                  value={outroCustomText}
                  onChange={(e) => setOutroCustomText(e.target.value)}
                  placeholder="Pl. kérdezze meg a felhasználót a hozzászólásokban a véleményéről"
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addQa"
                    checked={addQa}
                    onChange={(e) => setAddQa(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="addQa" className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                    Gyakran Ismételt Kérdések (Q&A) generálása a cikk végére
                    <span className="text-indigo-600 text-[10px] uppercase font-bold bg-indigo-50 px-1 rounded">PRÉMIUM</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 pl-6">
                  Automatikusan létrehoz egy releváns FAQ részt a bejegyzés végén.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addCta"
                    checked={addCta}
                    onChange={(e) => setAddCta(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="addCta" className="text-xs text-slate-700 font-semibold">
                    CTA (Call to Action) gomb beágyazása
                  </label>
                </div>
                {addCta && (
                  <div className="grid grid-cols-2 gap-2 pl-6 animate-fade-in">
                    <input
                      type="text"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="Gomb felirata..."
                      className="px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="URL cím..."
                      className="px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleGenerate}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md transition hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              Teljes Cikk Generálása
            </button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="py-16 text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <Sparkles className="w-6 h-6 text-indigo-600 absolute top-5 left-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">A cikk generálása folyamatban van...</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
              Ez körülbelül 10-15 másodpercet vehet igénybe. A Gemini éppen strukturálja az alfejezeteket, ellenőrzi a kulcsszavakat, és felépíti a WordPress HTML formátumot.
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">AI Sikeres Generálás</span>
              <span className="text-xs text-slate-500 font-medium">{generatedContent.length} karakter</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePublish('draft')}
                disabled={isSyncingWp}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Mentés piszkozatként
              </button>
              <button
                onClick={() => handlePublish('publish')}
                disabled={isSyncingWp}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSyncingWp ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Szinkronizálás...
                  </>
                ) : (
                  'Közzététel WordPress-ben'
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor preview */}
            <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  Gutenberg HTML Élő Előnézet
                </span>
                <span className="text-[10px] text-slate-400 font-mono">index.php &gt; entry-content</span>
              </div>
              <div className="p-6 overflow-y-auto max-h-[500px] prose prose-slate prose-sm max-w-none">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-4">{title}</h1>
                <div 
                  dangerouslySetInnerHTML={{ __html: generatedContent }} 
                  className="space-y-4 text-slate-700 leading-relaxed outline-none"
                  contentEditable
                  onBlur={(e) => setGeneratedContent(e.currentTarget.innerHTML)}
                />
              </div>
            </div>

            {/* Meta tags sidebar */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">SEO Meta & Extrakciók</h4>
                
                <div>
                  <label className="block text-xs text-slate-500 font-semibold mb-1">Cikk Excerpt (Meta leírás)</label>
                  <textarea
                    rows={4}
                    value={generatedExcerpt}
                    onChange={(e) => setGeneratedExcerpt(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                  />
                </div>

                {keywords && (
                  <div className="space-y-1.5">
                    <label className="block text-xs text-slate-500 font-semibold">Generált Kulcsszavak & Címkék</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-lg max-h-[120px] overflow-y-auto">
                      {keywords.split(',').map(k => k.trim()).filter(Boolean).map((kw, i) => (
                        <span key={i} className="inline-block bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded transition">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                  <h5 className="text-[11px] font-bold text-indigo-800 uppercase">Beágyazott rövidkódok</h5>
                  <p className="text-[10px] text-indigo-700/80 mt-1 leading-relaxed">
                    Ezt a tartalmat közvetlenül beillesztettük a WordPress bejegyzések közé. Használhatsz shortcode-okat is bármely oldalon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
