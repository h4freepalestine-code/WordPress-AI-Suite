import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Loader, FileText, Play, Check } from 'lucide-react';
import { WPPost } from '../types';

interface SpeechProps {
  onAddPost: (post: WPPost) => void;
  onAddLog: (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => void;
}

export const SpeechToPost: React.FC<SpeechProps> = ({ onAddPost, onAddLog }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [topic, setTopic] = useState('A környezetbarát asztali bambusz kiegészítők előnyei');
  const [instructions, setInstructions] = useState('Mutasd be miért jobb mint a műanyag, említsd meg a stílust, tartósságot és a zöld irodai megközelítést. Legyen laza és motiváló hangvételű.');

  const [transcript, setTranscript] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postKeywords, setPostKeywords] = useState<string[]>([]);
  const [isSyncingWp, setIsSyncingWp] = useState(false);

  const [simulationSeconds, setSimulationSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);

  const startRecording = () => {
    setIsRecording(true);
    setSimulationSeconds(0);
    const interval = setInterval(() => {
      setSimulationSeconds(s => s + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };

  const handleConvert = async () => {
    if (!topic.trim()) {
      alert('Kérlek add meg a hangfelvétel témáját!');
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/speech-to-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockAudioTopic: topic, instructions })
      });

      const data = await response.json();
      if (data.success) {
        setTranscript(data.transcript);
        setPostTitle(data.title);
        
        let finalContent = data.postContent;
        const kws = data.keywords || [];
        setPostKeywords(kws);

        if (kws.length > 0) {
          const tagsHtml = `
            <div class="wp-block-ai-suite-tags mt-8 pt-4 border-t border-slate-200">
              <p style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">Címkék & Kulcsszavak:</p>
              <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${kws.map((k: string) => `
                  <span class="inline-block bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-rose-150 mr-1.5 my-1" style="display: inline-block; background-color: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-decoration: none; margin-right: 6px;">#${k}</span>
                `).join('')}
              </div>
            </div>
          `;
          finalContent += tagsHtml;
        }
        setPostContent(finalContent);

        onAddLog(
          `Beszéd-alapú bejegyzéskészítés: '${topic}'`,
          'gemini-3.5-flash',
          topic.length + instructions.length,
          finalContent.length,
          1200,
          0.00018
        );
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback
      setTranscript(`[Hangfelvétel transzkripció szimulációja - ${topic}]\n"Sziasztok! Ma arról szeretnék beszélni, hogy miért annyira fantasztikusak a bambusz asztali kiegészítők az otthoni irodánkban. Előszors is, sokkal jobban néznek ki, mint a gagyi olcsó műanyag dobozok..."`);
      setPostTitle(`Miért a bambusz a legjobb választás az otthoni irodádba?`);
      
      const fallbackKws = ['bambusz', 'fenntartható iroda', 'diktálás', 'zöld iroda', 'stílus'];
      setPostKeywords(fallbackKws);

      const tagsHtml = `
        <div class="wp-block-ai-suite-tags mt-8 pt-4 border-t border-slate-200">
          <p style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">Címkék & Kulcsszavak:</p>
          <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${fallbackKws.map((k: string) => `
              <span class="inline-block bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-rose-150 mr-1.5 my-1" style="display: inline-block; background-color: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-decoration: none; margin-right: 6px;">#${k}</span>
            `).join('')}
          </div>
        </div>
      `;

      setPostContent(`<h2>1. Természetes elegancia az íróasztalon</h2><p>A bambusz organikus melegséget és skandináv minimalizmust hoz a munkakörnyezetedbe. A műanyaggal ellentétben a természetes mintázat minden darabot egyedivé tesz.</p><h2>2. Rendkívüli tartósság és fenntarthatóság</h2><p>A bambusz az egyik leggyorsabban növő fás szárú növény a világon, így a kitermelése nem okoz erdőirtást. Emellett szívósabb és ellenállóbb, mint a legtöbb keményfa.</p>${tagsHtml}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!postTitle) return;

    const wpUrl = localStorage.getItem('wp_site_url');
    const wpToken = localStorage.getItem('wp_sync_token');
    
    let livePublishSuccess = false;
    let livePermalink = '';

    if (wpUrl && wpToken) {
      setIsSyncingWp(true);
      try {
        const payload = {
          title: postTitle,
          content: postContent,
          excerpt: 'Hangfelvételből generált bejegyzés az otthoni kiegészítők témájában.',
          status: 'draft',
          keywords: postKeywords,
          featured_image: 'https://picsum.photos/seed/speech/800/600',
          category: 'Diktált tartalom'
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
        console.error("WordPress speech post live publishing failed:", err);
      } finally {
        setIsSyncingWp(false);
      }
    }

    const newPost: WPPost = {
      id: `post-speech-${Date.now()}`,
      title: postTitle,
      excerpt: 'Hangfelvételből generált bejegyzés az otthoni kiegészítők témájában.',
      content: postContent,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      author: 'AI Speech Engine',
      category: 'Diktált tartalom',
      keywords: postKeywords,
      images: ['https://picsum.photos/seed/speech/800/600'],
      hasAudio: true
    };
    onAddPost(newPost);

    if (livePublishSuccess) {
      alert(`Sikeres szinkronizáció! A diktált cikk közzétéve a WordPress oldalon: ${livePermalink || wpUrl}`);
      onAddLog(`Sikeres diktált cikk szinkronizáció: ${postTitle}`, 'REST API', 0, 0, 0, 0);
    } else if (wpUrl && wpToken) {
      alert(`Mentve a helyi adatbázisba, de a WordPress szinkronizáció meghiúsult (CORS korlátozás vagy hiba miatt).`);
    } else {
      alert('A hangfelvételből készült bejegyzés sikeresen elmentve a helyi listába! Élő WordPress szinkronizációhoz töltsd le és konfiguráld a plugint a "WordPress Integráció" menüpontban!');
    }

    // Reset
    setTranscript('');
    setPostTitle('');
    setPostContent('');
    setPostKeywords([]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Mic className="text-rose-500 w-6 h-6 animate-pulse" />
          <span>Speech-to-Post & Audio Converter (Whisper)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Diktáld le a gondolataidat hangban, és az AI másodpercek alatt készít belőle egy tökéletesen formázott, strukturált blogbejegyzést.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - recorder & settings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hangfelvétel & Diktálás</h3>

            <div className="text-center p-6 bg-white border border-slate-200 rounded-xl space-y-3 relative overflow-hidden">
              {isRecording && (
                <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
              )}
              <div className="mx-auto flex items-center justify-center">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center transition shadow-lg relative"
                  >
                    <MicOff className="w-6 h-6 animate-pulse" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition shadow-md"
                  >
                    <Mic className="w-6 h-6 text-rose-400" />
                  </button>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700">
                  {isRecording ? 'Felvétel folyamatban...' : 'Kattints a diktálás indításához'}
                </h4>
                {isRecording && (
                  <p className="text-xs font-mono text-rose-600 font-bold mt-1">00:{simulationSeconds < 10 ? `0${simulationSeconds}` : simulationSeconds}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Felvétel témája</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">AI szerkesztési instrukciók</label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-3 border border-slate-250 rounded-lg text-xs"
              />
            </div>

            <button
              onClick={handleConvert}
              disabled={isProcessing || isRecording}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Hangfeldolgozás és cikkírás...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  Konvertálás Blogbejegyzéssé
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right column - transcript & structured preview */}
        <div className="lg:col-span-7 space-y-4">
          {transcript && (
            <div className="space-y-4">
              {/* Transcript block */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lokalizált Transzkripció (Speech-to-Text)</span>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{transcript}"</p>
              </div>

              {/* Generated article block */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    AI Strukturált WordPress Bejegyzés
                  </span>
                  <button
                    onClick={handlePublish}
                    disabled={isSyncingWp}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isSyncingWp ? (
                      <>
                        <Loader className="w-3 h-3 animate-spin" />
                        Szinkronizálás...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Mentés WordPress-be
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5 prose prose-slate prose-sm max-h-[300px] overflow-y-auto">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">{postTitle}</h3>
                  <div dangerouslySetInnerHTML={{ __html: postContent }} className="text-xs text-slate-700 space-y-3 mt-3 leading-relaxed" />
                </div>
              </div>
            </div>
          )}
          {!transcript && (
            <div className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-6 text-center text-slate-400">
              <div className="space-y-2">
                <Mic className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Nincs még feldolgozott hangfelvétel.</p>
                <p className="text-[10px] max-w-sm mx-auto">Kattints a felvétel gombra, mondd el az ötleteidet, majd alakítsd át őket egy komplett cikké az AI segítségével.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
