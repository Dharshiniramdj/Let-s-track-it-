import React, { useState, useEffect } from 'react';
import { Transaction, Suggestion, AISettings, TransactionType, Category, SavingsGoal, Account } from '../types';
import GeminiChatbot from './GeminiChatbot';
import { 
  Sparkles, CheckCircle2, AlertTriangle, TrendingUp, PiggyBank, RefreshCw, 
  Loader2, ArrowRight, BrainCircuit, Lightbulb, Zap, MessageSquare, Compass 
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  aiSettings: AISettings;
  goals?: SavingsGoal[];
  account?: Account;
  initialChatPrompt?: string;
  onClearInitialChatPrompt?: () => void;
}

const AdvisorView: React.FC<Props> = ({ 
  transactions, 
  aiSettings, 
  goals = [], 
  account,
  initialChatPrompt,
  onClearInitialChatPrompt
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'CHAT' | 'RULES'>('CHAT');
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Local rule-based analysis
  const generateLocalSuggestions = () => {
    const list: Suggestion[] = [];
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const monthTx = transactions.filter(t => t.date.startsWith(thisMonth));
    
    const income = monthTx.filter(t => t.type === TransactionType.INCOME).reduce((s,t) => s + t.amount, 0);
    const expense = monthTx.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t) => s + t.amount, 0);

    // Rule 1: High Spending Warning
    if (expense > income && income > 0) {
        list.push({
            id: 'rule-overspend',
            title: 'Spending Alert',
            message: `You've spent ₹${(expense - income).toLocaleString()} more than your income this month. Consider cutting back on non-essentials.`,
            type: 'ALERT',
            action: 'Review Expenses',
            impact: 'HIGH'
        });
    }

    // Rule 2: Category Concentration
    const catTotals: Record<string, number> = {};
    monthTx.forEach(t => { if(t.type === TransactionType.EXPENSE) catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
    
    Object.entries(catTotals).forEach(([cat, amt]) => {
        if (amt > (expense * 0.4) && expense > 2000) {
            list.push({
                id: `rule-cat-${cat}`,
                title: `${cat} Focus`,
                message: `Over 40% of your spending this month is on ${cat}. Is this expected?`,
                type: 'HABIT',
                action: 'Set Budget',
                impact: 'MEDIUM'
            });
        }
    });

    // Rule 3: Small Purchase Frequency
    const smallPurchases = monthTx.filter(t => t.type === TransactionType.EXPENSE && t.amount < 150);
    if (smallPurchases.length > 10) {
        list.push({
            id: 'rule-small',
            title: 'Micro-Spending',
            message: `You had ${smallPurchases.length} small purchases (< ₹150) this month. Quick commerce and coffee add up quickly!`,
            type: 'SAVING',
            action: 'Track Daily',
            impact: 'MEDIUM'
        });
    }

    // Rule 4: Savings Kudos
    if (income > expense * 1.5 && income > 0) {
        list.push({
            id: 'rule-kudos',
            title: 'Great Progress!',
            message: `Your savings rate is excellent this month. You've saved over 30% of your income.`,
            type: 'KUDOS',
            action: 'Keep it up',
            impact: 'HIGH'
        });
    }

    // Rule 5: Goals Over-Budget check
    goals.forEach(g => {
      const catSpent = monthTx
        .filter(t => t.type === TransactionType.EXPENSE && (t.category.toUpperCase() === g.category.toUpperCase() || t.purpose.toUpperCase().includes(g.category.toUpperCase())))
        .reduce((sum, t) => sum + t.amount, 0);

      if (catSpent > g.targetAmount) {
        list.push({
          id: `rule-goal-${g.id}`,
          title: `${g.category} Target Exceeded`,
          message: `You've spent ₹${catSpent.toLocaleString()} against your ₹${g.targetAmount.toLocaleString()} target for ${g.category}.`,
          type: 'ALERT',
          action: 'Adjust Target',
          impact: 'HIGH'
        });
      }
    });

    return list;
  };

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
        const results = generateLocalSuggestions();
        setSuggestions(results);
        setLoading(false);
        setAppliedIds(new Set());
    }, 500);
  };

  const handleApply = (id: string) => {
    const newApplied = new Set(appliedIds);
    newApplied.add(id);
    setAppliedIds(newApplied);
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
          case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
          case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
          case 'LOW': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
          default: return 'bg-[var(--bg-secondary)] text-[var(--text-muted)]';
      }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
      {/* Subtab Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border-color)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('CHAT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'CHAT'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <MessageSquare size={16} />
            <span>Gemini Chatbot</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-mono font-bold">AI</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('RULES');
              if (suggestions.length === 0) handleGenerate();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'RULES'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Zap size={16} />
            <span>Rule-Based Audits</span>
          </button>
        </div>

        <div className="text-xs text-[var(--text-muted)] pr-3 hidden sm:block">
          {activeSubTab === 'CHAT' ? 'Multi-turn intelligent financial coaching' : 'Instant offline rule heuristics'}
        </div>
      </div>

      {/* Chat View */}
      {activeSubTab === 'CHAT' && (
        <GeminiChatbot
          transactions={transactions}
          goals={goals}
          account={account}
          initialPrompt={initialChatPrompt}
          onClearInitialPrompt={onClearInitialChatPrompt}
        />
      )}

      {/* Rule-Based Heuristics View */}
      {activeSubTab === 'RULES' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-secondary)] to-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-3xl relative overflow-hidden shadow-lg group">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">Local Heuristic Auditor</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md">
                  Fast pattern detection scanning for overspending, high category concentrations, and goal alerts.
                </p>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-amber-500 text-black px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-amber-400 transition-all disabled:opacity-50 shrink-0"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Lightbulb size={16} />}
                {loading ? 'Analyzing...' : 'Re-run Audit'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((s) => (
              <div 
                key={s.id} 
                className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${appliedIds.has(s.id) ? 'opacity-50 grayscale' : ''}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-[var(--bg-secondary)] rounded-xl">
                      {getIcon(s.type)}
                    </div>
                    <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border tracking-wider ${getImpactColor(s.impact)}`}>
                      {s.impact}
                    </span>
                  </div>
                  <h4 className="font-bold text-[var(--text-main)] text-base mb-2">{s.title}</h4>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-6">{s.message}</p>
                </div>

                <button 
                  onClick={() => handleApply(s.id)}
                  disabled={appliedIds.has(s.id)}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs ${appliedIds.has(s.id) ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-default' : 'bg-[var(--bg-secondary)] hover:bg-amber-500 hover:text-black text-[var(--text-main)] border border-[var(--border-color)]'}`}
                >
                  {appliedIds.has(s.id) ? (
                    <>
                      <CheckCircle2 size={16} /> Reviewed
                    </>
                  ) : (
                    <>
                      {s.action} <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorView;