import React, { useState, useEffect } from 'react';
import { Transaction, Suggestion, AISettings } from '../types';
import { generateActionableSuggestions } from '../services/geminiService';
import { Sparkles, CheckCircle2, AlertTriangle, TrendingUp, PiggyBank, RefreshCw, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  aiSettings: AISettings;
}

const AdvisorView: React.FC<Props> = ({ transactions, aiSettings }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Attempt to load from local storage first to avoid re-generating on every view switch
    const saved = localStorage.getItem('lets_track_it_suggestions');
    const savedDate = localStorage.getItem('lets_track_it_suggestions_date');
    const today = new Date().toDateString();

    if (saved && savedDate === today) {
        setSuggestions(JSON.parse(saved));
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    const results = await generateActionableSuggestions(transactions, aiSettings.persona);
    setSuggestions(results);
    localStorage.setItem('lets_track_it_suggestions', JSON.stringify(results));
    localStorage.setItem('lets_track_it_suggestions_date', new Date().toDateString());
    setLoading(false);
    setAppliedIds(new Set()); // Reset applied state for new suggestions
  };

  const handleApply = (id: string) => {
    const newApplied = new Set(appliedIds);
    newApplied.add(id);
    setAppliedIds(newApplied);
    // In a real app, this might trigger a state update elsewhere or navigate to a settings page
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'ALERT': return <AlertTriangle className="text-rose-500" />;
          case 'SAVING': return <PiggyBank className="text-emerald-500" />;
          case 'HABIT': return <RefreshCw className="text-blue-500" />;
          case 'KUDOS': return <Sparkles className="text-amber-500" />;
          default: return <Sparkles className="text-amber-500" />;
      }
  };

  const getImpactColor = (impact: string) => {
      switch(impact) {
          case 'HIGH': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
          case 'MEDIUM': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
          case 'LOW': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
          default: return 'bg-stone-800 text-stone-500';
      }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-0 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#1E1E1E] to-stone-900 border border-stone-800 p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
                <Sparkles size={120} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-amber-500 p-2 rounded-lg text-black"><Sparkles size={20} /></div>
                    <span className="text-amber-500 font-bold tracking-wider text-xs uppercase">AI Financial Coach</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Your Smart Advisor</h2>
                <p className="text-stone-400 max-w-md mb-8 leading-relaxed">
                    I analyze your spending patterns to find opportunities for saving and better financial habits.
                </p>
                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
                    {loading ? 'Analyzing Data...' : 'Analyze My Finances'}
                </button>
            </div>
        </div>

        {/* Suggestions List */}
        <div>
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-white text-lg">Suggestions to Apply</h3>
                <span className="text-xs text-stone-500">
                    {suggestions.length > 0 ? `${suggestions.length} items found` : 'No active suggestions'}
                </span>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-40 bg-[#1E1E1E] rounded-2xl animate-pulse border border-stone-800"></div>
                    ))}
                </div>
            )}

            {!loading && suggestions.length === 0 && (
                <div className="text-center py-12 text-stone-500 bg-[#1E1E1E] rounded-3xl border border-stone-800 border-dashed">
                    <Sparkles size={40} className="mx-auto mb-4 opacity-30" />
                    <p>Tap "Analyze My Finances" to generate new insights.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((s) => (
                    <div 
                        key={s.id} 
                        className={`bg-[#1E1E1E] border border-stone-800 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:border-stone-600 ${appliedIds.has(s.id) ? 'opacity-50 grayscale' : ''}`}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-stone-800 rounded-xl group-hover:scale-110 transition-transform">
                                    {getIcon(s.type)}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getImpactColor(s.impact)}`}>
                                    {s.impact} IMPACT
                                </span>
                            </div>
                            <h4 className="font-bold text-white text-lg mb-2">{s.title}</h4>
                            <p className="text-stone-400 text-sm leading-relaxed mb-6">{s.message}</p>
                        </div>

                        <button 
                            onClick={() => handleApply(s.id)}
                            disabled={appliedIds.has(s.id)}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appliedIds.has(s.id) ? 'bg-stone-800 text-stone-500 cursor-default' : 'bg-stone-800 hover:bg-amber-500 hover:text-black text-white'}`}
                        >
                            {appliedIds.has(s.id) ? (
                                <>
                                    <CheckCircle2 size={18} /> Applied
                                </>
                            ) : (
                                <>
                                    {s.action} <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default AdvisorView;