import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Layers,
  ShoppingBag,
  Image as ImageIcon,
  MessageSquare,
  Database,
  Mic,
  Cpu,
  Bookmark,
  Sparkles,
  Terminal,
  Settings,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Plus,
  Globe
} from 'lucide-react';

// Component imports
import { DashboardOverview } from './components/DashboardOverview';
import { ContentGenerator } from './components/ContentGenerator';
import { BulkEditor } from './components/BulkEditor';
import { WooCommerceAI } from './components/WooCommerceAI';
import { ImageGenerator } from './components/ImageGenerator';
import { ChatbotConfig } from './components/ChatbotConfig';
import { EmbeddingsIndex } from './components/EmbeddingsIndex';
import { SpeechToPost } from './components/SpeechToPost';
import { AITraining } from './components/AITraining';
import { PromptBase } from './components/PromptBase';
import { FormsBuilder } from './components/FormsBuilder';
import { LogsList } from './components/LogsList';
import { SettingsPanel } from './components/Settings';
import { WPIntegration } from './components/WPIntegration';

// Mock data & Types
import { INITIAL_POSTS, INITIAL_PRODUCTS, INITIAL_LOGS, INITIAL_EMBEDDINGS } from './mockData';
import { WPPost, WPProduct, AILog, EmbeddingIndex, ChatbotSetting, PromptTemplate } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Global State
  const [posts, setPosts] = useState<WPPost[]>(INITIAL_POSTS);
  const [products, setProducts] = useState<WPProduct[]>(INITIAL_PRODUCTS);
  const [logs, setLogs] = useState<AILog[]>(INITIAL_LOGS);
  const [embeddings, setEmbeddings] = useState<EmbeddingIndex[]>(INITIAL_EMBEDDINGS);
  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSetting>({
    botName: 'WP AI Asszisztens',
    welcomeMessage: 'Szia! Miben segíthetek ma?',
    systemPrompt: 'Te egy segítőkész WordPress asszisztens vagy.',
    primaryColor: '#4f46e5',
    widgetPosition: 'bottom-right',
    isModerationEnabled: false,
    associatedEmbeddingIndexId: ''
  });

  const [apiKeyStatus, setApiKeyStatus] = useState({ hasApiKey: false, loading: true });
  
  // For prompt transfers
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);

  // Check server API Key presence
  useEffect(() => {
    const checkKey = async () => {
      try {
        const res = await fetch('/api/ai/health');
        const data = await res.json();
        setApiKeyStatus({ hasApiKey: data.hasApiKey, loading: false });
      } catch {
        setApiKeyStatus({ hasApiKey: false, loading: false });
      }
    };
    checkKey();
  }, []);

  // Helpers
  const handleAddPost = (post: WPPost) => {
    setPosts([post, ...posts]);
  };

  const handleAddBulkPosts = (newPosts: WPPost[]) => {
    setPosts([...newPosts, ...posts]);
  };

  const handleUpdateProduct = (updatedProduct: WPProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleUpdateEmbeddingIndex = (updatedIndex: EmbeddingIndex) => {
    setEmbeddings(embeddings.map(e => e.id === updatedIndex.id ? updatedIndex : e));
  };

  const handleAddLog = (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => {
    const newLog: AILog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      model,
      promptLength: promptL,
      responseLength: responseL,
      tokensUsed: tokens,
      cost
    };
    setLogs([newLog, ...logs]);
  };

  // Navigating to cikkíró with prefilled prompt template
  const handleUsePrompt = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setActiveTab('cikk-iro');
  };

  // Sidebar navigation options
  const navItems = [
    { id: 'dashboard', label: 'Vezérlőpult', icon: LayoutDashboard },
    { id: 'cikk-iro', label: 'AI Cikkíró', icon: FileText },
    { id: 'bulk-editor', label: 'Tömeges Szerkesztő', icon: Layers },
    { id: 'woocommerce', label: 'WooCommerce AI', icon: ShoppingBag },
    { id: 'image-gen', label: 'Képgenerátor', icon: ImageIcon },
    { id: 'chatbot-config', label: 'Chatbot Beágyazás', icon: MessageSquare },
    { id: 'embeddings', label: 'Beágyazások (Embeddings)', icon: Database },
    { id: 'speech-to-post', label: 'Speech-to-Post', icon: Mic },
    { id: 'ai-training', label: 'AI-betanítás', icon: Cpu },
    { id: 'promptbase', label: 'PromptBase', icon: Bookmark },
    { id: 'forms-builder', label: 'AI Űrlapok', icon: Sparkles },
    { id: 'logs', label: 'Naplózás és Költségek', icon: Terminal },
    { id: 'wp-integration', label: 'WordPress Integráció', icon: Globe },
    { id: 'settings', label: 'Bővítmény Beállítások', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* WP Admin Top Bar */}
      <header className="bg-slate-900 text-white h-12 flex items-center justify-between px-4 z-40 shrink-0 select-none border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded transition lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-300" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="text-white text-sm font-black tracking-tight flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              WP <span className="text-indigo-400">AI SUITE</span>
            </span>
            <span className="text-[10px] bg-indigo-500 text-white px-1 py-0.2 rounded font-bold uppercase tracking-wider hidden sm:inline-block">
              Open-Source Premium
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium pl-6 border-l border-slate-800">
            <span>WordPress 6.5.3</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <a href="/" target="_blank" className="hover:text-white transition flex items-center gap-0.5">
              <span>Nyílt forráskódú bemutató</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* API key status indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${apiKeyStatus.hasApiKey ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
              {apiKeyStatus.hasApiKey ? 'AI Engine: Aktív' : 'Nincs API Kulcs'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-400">
              WP
            </div>
            <div className="hidden lg:block text-left leading-none">
              <h4 className="text-[11px] font-bold">mmonlineltd@gmail.com</h4>
              <span className="text-[9px] text-slate-400">Rendszergazda (Administrator)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body container */}
      <div className="flex-1 flex overflow-hidden">
        {/* WordPress-style Left Sidebar Navigation */}
        <aside
          className={`bg-slate-850 text-slate-300 w-64 flex flex-col shrink-0 select-none z-30 transition-transform duration-200 border-r border-slate-900 absolute lg:relative top-12 lg:top-0 bottom-0 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}`}
        >
          {/* Sidebar Menu Header */}
          <div className={`p-4 border-b border-slate-800 flex items-center justify-between ${!sidebarOpen ? 'justify-center lg:p-2' : ''}`}>
            {sidebarOpen ? (
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                WordPress Vezérlés
              </span>
            ) : (
              <span className="text-[10px] font-bold text-indigo-400">AI</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1 hover:bg-slate-850 rounded transition text-slate-400"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-2.5 space-y-0.5 custom-scrollbar">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // On mobile, close sidebar on selection
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all relative ${isActive ? 'bg-indigo-600/10 text-white border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  title={item.label}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              posts={posts}
              products={products}
              logs={logs}
              apiKeyStatus={apiKeyStatus}
              setTab={(tab) => {
                const tabMap: Record<string, string> = {
                  'content': 'cikk-iro',
                  'images': 'image-gen',
                  'settings': 'settings',
                  'bulk': 'bulk-editor',
                  'chatbot': 'chatbot-config',
                  'woocommerce': 'woocommerce',
                  'logs': 'logs',
                };
                setActiveTab(tabMap[tab] || tab);
              }}
            />
          )}

          {activeTab === 'cikk-iro' && (
            <ContentGenerator
              posts={posts}
              onAddPost={handleAddPost}
              onAddLog={handleAddLog}
              selectedPrompt={selectedPrompt}
              onClearSelectedPrompt={() => setSelectedPrompt(null)}
            />
          )}

          {activeTab === 'bulk-editor' && (
            <BulkEditor
              onAddBulkPosts={handleAddBulkPosts}
              onAddLog={handleAddLog}
            />
          )}

          {activeTab === 'woocommerce' && (
            <WooCommerceAI
              products={products}
              onUpdateProduct={handleUpdateProduct}
              onAddLog={handleAddLog}
            />
          )}

          {activeTab === 'image-gen' && (
            <ImageGenerator
              onAddLog={handleAddLog}
            />
          )}

          {activeTab === 'chatbot-config' && (
            <ChatbotConfig
              settings={chatbotSettings}
              onSaveSettings={setChatbotSettings}
              embeddingIndexes={embeddings}
              posts={posts}
              products={products}
            />
          )}

          {activeTab === 'embeddings' && (
            <EmbeddingsIndex
              indexes={embeddings}
              onUpdateIndex={handleUpdateEmbeddingIndex}
              posts={posts}
              products={products}
            />
          )}

          {activeTab === 'speech-to-post' && (
            <SpeechToPost
              onAddPost={handleAddPost}
              onAddLog={handleAddLog}
            />
          )}

          {activeTab === 'ai-training' && (
            <AITraining
              posts={posts}
              products={products}
              onAddLog={handleAddLog}
            />
          )}

          {activeTab === 'promptbase' && (
            <PromptBase
              onUsePrompt={handleUsePrompt}
            />
          )}

          {activeTab === 'forms-builder' && (
            <FormsBuilder
              onAddLog={handleAddLog}
            />
          )}

          {activeTab === 'logs' && (
            <LogsList
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          )}

          {activeTab === 'wp-integration' && (
            <WPIntegration
              onAddLog={handleAddLog}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              apiKeyStatus={apiKeyStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
