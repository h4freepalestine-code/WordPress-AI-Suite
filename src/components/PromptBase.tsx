import React, { useState } from 'react';
import { Sparkles, Search, Clipboard, Check, ArrowRight } from 'lucide-react';
import { PROMPT_BASE } from '../mockData';
import { PromptTemplate } from '../types';

interface PromptBaseProps {
  onUsePrompt: (prompt: PromptTemplate) => void;
}

export const PromptBase: React.FC<PromptBaseProps> = ({ onUsePrompt }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCopy = (id: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const categories = [
    { id: 'all', label: 'Összes' },
    { id: 'seo', label: 'SEO & Cikkíró' },
    { id: 'copywriting', label: 'Marketing' },
    { id: 'creative', label: 'Kreatív írás' },
    { id: 'translation', label: 'Lokalizáció' },
    { id: 'ecommerce', label: 'E-kereskedelem' }
  ];

  const filteredPrompts = PROMPT_BASE.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500 w-6 h-6 fill-amber-500" />
            <span>PromptBase - Azonnal használható promptok</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Válassz a több száz professzionális, letesztelt és magas minőségű WordPress és marketing prompt közül.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés a promptok között..."
            className="pl-8 pr-3 py-1.5 border border-slate-250 rounded-lg text-xs w-60 text-slate-800"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${activeCategory === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-xs transition flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {p.category}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{p.description}</p>
            </div>

            <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-lg font-mono text-[10px] text-slate-600 line-clamp-3">
              {p.prompt}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleCopy(p.id, p.prompt)}
                className="text-xs text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1"
              >
                {copiedId === p.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Másolva!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Másolás</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onUsePrompt(p)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <span>Szerkesztőbe küldés</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
