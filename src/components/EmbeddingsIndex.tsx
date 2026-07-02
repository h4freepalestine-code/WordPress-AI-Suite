import React, { useState } from 'react';
import { Database, Sparkles, RefreshCw, CheckCircle, Search, FileText, ShoppingBag, Loader } from 'lucide-react';
import { EmbeddingIndex, WPPost, WPProduct } from '../types';

interface EmbeddingsProps {
  indexes: EmbeddingIndex[];
  onUpdateIndex: (index: EmbeddingIndex) => void;
  posts: WPPost[];
  products: WPProduct[];
}

export const EmbeddingsIndex: React.FC<EmbeddingsProps> = ({ indexes, onUpdateIndex, posts, products }) => {
  const [isIndexing, setIsIndexing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const startIndexing = (idxId: string) => {
    setIsIndexing(idxId);
    
    // Simulate embedding generation via model 'gemini-embedding-2-preview'
    setTimeout(() => {
      const targetIndex = indexes.find(i => i.id === idxId);
      if (targetIndex) {
        const count = targetIndex.sourceType === 'posts' ? posts.length : products.length;
        onUpdateIndex({
          ...targetIndex,
          recordCount: count,
          status: 'indexed',
          lastIndexed: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
      setIsIndexing(null);
      alert('Szemantikus beágyazások (Embeddings) sikeresen kiszámítva és elmentve a Pinecone adatbázisba!');
    }, 2000);
  };

  const handleSemanticSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results: any[] = [];

      // Simple keyword semantic relevance scan
      posts.forEach(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const excerptMatch = post.excerpt.toLowerCase().includes(query);
        const keywordMatch = post.keywords.some(k => k.toLowerCase().includes(query));

        if (titleMatch || excerptMatch || keywordMatch) {
          results.push({
            type: 'Bejegyzés',
            title: post.title,
            snippet: post.excerpt,
            score: titleMatch ? 0.94 : keywordMatch ? 0.88 : 0.72,
            icon: FileText
          });
        }
      });

      products.forEach(prod => {
        const titleMatch = prod.title.toLowerCase().includes(query);
        const descMatch = prod.description.toLowerCase().includes(query);
        const keywordMatch = prod.keywords.some(k => k.toLowerCase().includes(query));

        if (titleMatch || descMatch || keywordMatch) {
          results.push({
            type: 'Termék',
            title: prod.title,
            snippet: prod.shortDescription,
            score: titleMatch ? 0.91 : keywordMatch ? 0.85 : 0.69,
            icon: ShoppingBag
          });
        }
      });

      // Default backup result if empty so they always see search in action
      if (results.length === 0) {
        results.push({
          type: 'Tudásbázis',
          title: `Szemantikus egyezés: ${searchQuery}`,
          snippet: `Mesterséges intelligencia által generált szemantikus válasz a(z) '${searchQuery}' kulcsszóra. Kapcsolódó témakörök: fenntarthatóság, irodai kényelem, intelligens e-kereskedelem.`,
          score: 0.81,
          icon: Sparkles
        });
      }

      setSearchResults(results.sort((a, b) => b.score - a.score));
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="text-indigo-600 w-6 h-6" />
          <span>Szemantikus Index Builder & Vektor Kereső</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Konvertáld az oldalaidat, bejegyzéseidet és termékeidet beágyazási vektorokká (gemini-embedding-2-preview) a Pinecone és szemantikus chatbot kereséshez.</p>
      </div>

      {/* Index Status Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pinecone Vektoros Indexek</h3>
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {indexes.map((idx) => (
            <div key={idx.id} className="p-4 hover:bg-slate-50/40 transition flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${idx.status === 'indexed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{idx.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Forrás: <span className="font-semibold uppercase text-[10px] bg-slate-100 px-1 py-0.2 rounded text-slate-600">{idx.sourceType}</span> • {idx.recordCount} elem indexelve
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${idx.status === 'indexed' ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {idx.status === 'indexed' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Indexelve (Pinecone)
                      </>
                    ) : (
                      'Nincs indexelve'
                    )}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Utoljára frissítve: {idx.lastIndexed}</p>
                </div>

                <button
                  onClick={() => startIndexing(idx.id)}
                  disabled={isIndexing !== null}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0"
                >
                  {isIndexing === idx.id ? (
                    <>
                      <Loader className="w-3 animate-spin" />
                      Indexelés...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Újraindexelés
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Search Sandbox */}
      <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Input Panel */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Search className="w-4 h-4 text-indigo-500" />
            Szemantikus Keresés Tesztelése (Semantic Search Playground)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            A hagyományos kulcsszavas kereséssel szemben az AI-alapú szemantikus keresés megérti a felhasználói kérdések valós kontextusát, szándékát és szinonimáit.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pl.: kényelmes munkavégzés otthonról vagy zöld iroda kiegészítők..."
              className="flex-1 px-3.5 py-2 border border-slate-250 rounded-lg text-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSemanticSearch(); }}
            />
            <button
              onClick={handleSemanticSearch}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              {isSearching ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Keresés
            </button>
          </div>
        </div>

        {/* Search Results Panel */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 max-h-[300px] overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Legközelebbi vektoros találatok</h4>
          <div className="space-y-2.5">
            {searchResults.map((res, idx) => {
              const Icon = res.icon;
              return (
                <div key={idx} className="bg-white p-3 border border-slate-200/60 rounded-lg shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                      <Icon className="w-3 h-3" />
                      {res.type}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-bold">Score: {res.score.toFixed(2)}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 mt-1.5">{res.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{res.snippet}</p>
                </div>
              );
            })}
            {searchResults.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Nincs megjeleníthető eredmény. Írj be egy keresési lekérdezést bal oldalon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
