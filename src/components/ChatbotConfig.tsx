import React, { useState } from 'react';
import { MessageSquare, Sparkles, Send, ShieldAlert, Check, RefreshCw, Bot, User } from 'lucide-react';
import { ChatbotSetting, EmbeddingIndex, WPPost, WPProduct } from '../types';

interface ChatbotConfigProps {
  settings: ChatbotSetting;
  onSaveSettings: (settings: ChatbotSetting) => void;
  embeddingIndexes: EmbeddingIndex[];
  posts: WPPost[];
  products: WPProduct[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
}

export const ChatbotConfig: React.FC<ChatbotConfigProps> = ({
  settings,
  onSaveSettings,
  embeddingIndexes,
  posts,
  products
}) => {
  // Config state
  const [botName, setBotName] = useState(settings.botName || 'WP AI Asszisztens');
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcomeMessage || 'Szia! Miben segíthetek ma?');
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt || 'Te egy segítőkész WordPress asszisztens vagy.');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#4f46e5');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>(settings.widgetPosition || 'bottom-right');
  const [isModerationEnabled, setIsModerationEnabled] = useState(settings.isModerationEnabled || false);
  const [selectedEmbedIndex, setSelectedEmbedIndex] = useState(settings.associatedEmbeddingIndexId || '');

  // Live simulator chat state
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', content: welcomeMessage }
  ]);
  const [isSending, setIsSending] = useState(false);

  const colors = [
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Smaragd', value: '#10b981' },
    { name: 'Királykék', value: '#2563eb' },
    { name: 'Grafit', value: '#1e293b' },
    { name: 'Korall', value: '#f43f5e' }
  ];

  const handleSave = () => {
    onSaveSettings({
      botName,
      welcomeMessage,
      systemPrompt,
      primaryColor,
      widgetPosition,
      isModerationEnabled,
      associatedEmbeddingIndexId: selectedEmbedIndex,
      avatar: 'https://picsum.photos/seed/bot/100/100'
    });
    alert('Bővítmény front-end chatbot beállításai sikeresen elmentve!');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}-user`,
      sender: 'user',
      content: chatInput
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSending(true);

    // Context from indexed posts/products if configured
    let contextItems: any[] = [];
    if (selectedEmbedIndex) {
      const idx = embeddingIndexes.find(i => i.id === selectedEmbedIndex);
      if (idx) {
        if (idx.sourceType === 'posts') {
          contextItems = posts.map(p => ({ title: p.title, content: p.content.substring(0, 300) }));
        } else if (idx.sourceType === 'products') {
          contextItems = products.map(p => ({ title: p.title, content: p.description.substring(0, 300) }));
        }
      }
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ content: userMsg.content }],
          systemPrompt,
          associatedEmbeddings: contextItems,
          isModerationEnabled
        })
      });

      const data = await response.json();
      if (data.success && data.response) {
        setMessages(prev => [...prev, {
          id: `m-${Date.now()}-bot`,
          sender: 'bot',
          content: data.response
        }]);
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback
      setMessages(prev => [...prev, {
        id: `m-${Date.now()}-bot`,
        sender: 'bot',
        content: `Szia! Én egy szimulált AI válasz vagyok. A megadott prompt alapján a(z) '${userMsg.content}' témában tudok segíteni neked.`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="text-indigo-600 w-6 h-6" />
          <span>Front-end Chatbot Beágyazás és Widget</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Konfiguráld a látogatóknak megjelenő intelligens ChatGPT chatbotot, saját színekkel és tudásbázissal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Settings Panel (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Megjelenés és Általános beállítások</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Bot Neve</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pozíció a weblapon</label>
                <select
                  value={widgetPosition}
                  onChange={(e) => setWidgetPosition(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs bg-white"
                >
                  <option value="bottom-right">Jobb alsó sarok (Bottom Right)</option>
                  <option value="bottom-left">Bal alsó sarok (Bottom Left)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Köszöntő szöveg</label>
              <input
                type="text"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Rendszerutasítás (System Prompt)</label>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-3 border border-slate-250 rounded-lg text-xs"
                placeholder="Te egy profi WordPress támogató asszisztens vagy..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Elsődleges témaszín</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setPrimaryColor(c.value)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition border ${primaryColor === c.value ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {primaryColor === c.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Pinecone Vector embeddings indexer & Moderation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Szemantikus tudásbázis & Vektor integráció</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kapcsolt Embeddings Index (Pinecone)</label>
              <select
                value={selectedEmbedIndex}
                onChange={(e) => setSelectedEmbedIndex(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs bg-white text-slate-700"
              >
                <option value="">Nincs összekapcsolva (Általános AI válaszok)</option>
                {embeddingIndexes.map((emb) => (
                  <option key={emb.id} value={emb.id}>{emb.name} ({emb.status === 'indexed' ? 'Aktív' : 'Nem indexelt'})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Ha összekapcsolsz egy indexet, a chatbot képes lesz válaszolni a weboldalad tényleges cikkeivel vagy termékeivel kapcsolatban.
              </p>
            </div>

            {/* Moderation Toggle */}
            <div className="flex items-start gap-3 pt-2 border-t border-slate-200/50">
              <input
                type="checkbox"
                id="isModerationEnabled"
                checked={isModerationEnabled}
                onChange={(e) => setIsModerationEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded mt-0.5"
              />
              <div>
                <label htmlFor="isModerationEnabled" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Chatbot Moderáció bekapcsolása
                  <span className="text-indigo-600 text-[10px] uppercase font-bold bg-indigo-50 px-1 rounded">PRÉMIUM</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Automatikus gyűlöletbeszéd-, spamszűrő és nem megfelelő hangnemű kérdések automatikus kiszűrése és blokkolása a Gemini segítségével.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition"
            >
              Beállítások mentése
            </button>
          </div>
        </div>

        {/* Right Side: Floating Client Widget Preview Simulator (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-end">
          <div className="bg-slate-100 rounded-2xl border border-slate-200/80 p-4 relative min-h-[480px] flex flex-col justify-between">
            {/* Simulation Header */}
            <div className="absolute top-3 left-4 right-4 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>Front-end Élő Szimuláció</span>
              <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">iframe-preview</span>
            </div>

            {/* Simulated Webpage body background */}
            <div className="flex-1 mt-6 p-4 text-center flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Bot className="w-12 h-12 text-slate-300" />
              <h4 className="text-xs font-semibold text-slate-600">A te WordPress weboldalad</h4>
              <p className="text-[10px] max-w-[200px] leading-relaxed">
                A chatbot widget beágyazása automatikusan megjelenik az oldalaid alján. Így fog mutatni és működni a látogatóknak:
              </p>
            </div>

            {/* Chatbox Widget Frame */}
            {chatOpen ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col h-[340px] animate-slide-in relative">
                {/* Widget Topbar */}
                <div className="px-4 py-3 text-white flex items-center justify-between shadow-xs transition" style={{ backgroundColor: primaryColor }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">AI</div>
                    <div>
                      <h4 className="text-xs font-bold leading-none">{botName}</h4>
                      <span className="text-[9px] opacity-75">Online • Segítőkész AI</span>
                    </div>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-white hover:opacity-80 text-xs">
                    Elrejt
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex items-start gap-2 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${m.sender === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {m.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>
                      <div className={`p-2.5 rounded-xl text-xs leading-relaxed shadow-3xs ${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-150'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-7">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>

                {/* Widget Footer Input */}
                <div className="p-2 border-t border-slate-150 bg-white flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                    placeholder="Írj egy üzenetet..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-1.5 text-white rounded-full flex items-center justify-center transition hover:opacity-90 shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
