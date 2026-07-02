import React, { useState } from 'react';
import { HelpCircle, Sparkles, Check, Play, Loader, FileText, Clipboard, Copy } from 'lucide-react';
import { INITIAL_FORMS } from '../mockData';
import { AIForm } from '../types';

interface FormsBuilderProps {
  onAddLog: (action: string, model: string, promptL: number, responseL: number, tokens: number, cost: number) => void;
}

export const FormsBuilder: React.FC<FormsBuilderProps> = ({ onAddLog }) => {
  const [forms, setForms] = useState<AIForm[]>(INITIAL_FORMS);
  const [selectedForm, setSelectedForm] = useState<AIForm>(INITIAL_FORMS[0]);
  
  // Dynamic form input values
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleInputChange = (name: string, value: string) => {
    setFormInputs({
      ...formInputs,
      [name]: value
    });
  };

  const handleCopyShortcode = (id: string, shortcode: string) => {
    navigator.clipboard.writeText(shortcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSubmitForm = async () => {
    setIsSubmitting(true);
    setGeneratedOutput('');

    // Simulate backend dynamic form generation using Gemini
    setTimeout(async () => {
      const answersSummary = Object.entries(formInputs).map(([k, v]) => `${k}: ${v}`).join(', ');
      
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ content: `Felhasználó válaszai az űrlapon: ${answersSummary}. Stílus: ${selectedForm.responseStyle}.` }],
            systemPrompt: selectedForm.systemPrompt
          })
        });

        const data = await response.json();
        if (data.success && data.response) {
          setGeneratedOutput(data.response);
          onAddLog(
            `AI Űrlap elküldve: '${selectedForm.name}'`,
            'gemini-3.5-flash',
            answersSummary.length,
            data.response.length,
            300,
            0.00005
          );
        } else {
          throw new Error();
        }
      } catch (e) {
        setGeneratedOutput(`Sikeresen megkaptuk a válaszaidat! Az AI elemzi őket: ${answersSummary}. \n\nÖsszeállítottunk egy egyedi tervet a megadott igényeid alapján. Kérlek győződj meg róla, hogy a Gemini kulcsod megfelelően működik.`);
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-purple-600 w-6 h-6" />
          <span>AI Űrlapok & Shortcode Beágyazás</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Hozz létre intelligens AI-űrlapokat, amelyeket egyszerű rövidkódokkal (Shortcodes) illeszthetsz be a WordPress oldalaidba.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Forms database list (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aktív AI Űrlapok a weboldalon</h3>
          <div className="space-y-3">
            {forms.map((form) => (
              <div
                key={form.id}
                onClick={() => {
                  setSelectedForm(form);
                  setFormInputs({});
                  setGeneratedOutput('');
                }}
                className={`p-4 border rounded-xl cursor-pointer transition flex flex-col justify-between gap-3 ${selectedForm.id === form.id ? 'border-purple-500 bg-purple-50/20 shadow-xs' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{form.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Mezők száma: {form.fields.length} db • Válaszstílus: {form.responseStyle}</p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-mono text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                    {form.shortcode}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyShortcode(form.id, form.shortcode);
                    }}
                    className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    {copiedId === form.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    Rövidkód másolása
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right pane: Interactive shortcode form live simulation (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-4 h-4 text-purple-600" />
                Shortcode Élő Előnézet & Tesztelés
              </span>
              <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 font-mono px-1.5 py-0.2 rounded font-bold">
                {selectedForm.shortcode}
              </span>
            </div>

            {/* Form Fields Render */}
            <div className="p-6 bg-white space-y-4 border-b border-slate-200/50">
              <h4 className="text-sm font-bold text-slate-800 mb-4">{selectedForm.name}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedForm.fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={formInputs[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                      >
                        <option value="">-- Válassz opciót --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formInputs[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Pl. ${field.label}...`}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSubmitForm}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      AI Válasz kiszámítása...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Űrlap Elküldése (AI Teszt)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Generated Output Display */}
            {generatedOutput && (
              <div className="p-6 bg-purple-50/40 animate-fade-in space-y-2">
                <h5 className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Látogató által kapott AI válasz:</h5>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{generatedOutput}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
