import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, SavingsGoal } from '../types';
import { Target, Plus, Edit2, Trash2, Sparkles, AlertCircle, CheckCircle2, TrendingUp, ShoppingBag, Laptop, Utensils, Zap, Car, Receipt, Film, HeartPulse, MoreHorizontal } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  goals: SavingsGoal[];
  activeAccountId: string;
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => void;
  onDeleteGoal: (id: string) => void;
  onAskAiAboutGoal?: (goalCategory: string, target: number, spent: number) => void;
}

// Popular suggested categories
const SUGGESTED_CATEGORIES = [
  { name: 'Groceries', value: 'GROCERY', defaultTarget: 12000, icon: Utensils },
  { name: 'Electronics', value: 'ELECTRONICS', defaultTarget: 20000, icon: Laptop },
  { name: 'Food & Dining', value: 'FOOD', defaultTarget: 8000, icon: Utensils },
  { name: 'Shopping', value: 'SHOPPING', defaultTarget: 10000, icon: ShoppingBag },
  { name: 'Travel & Commute', value: 'TRAVEL', defaultTarget: 5000, icon: Car },
  { name: 'Bills & Utilities', value: 'BILLS', defaultTarget: 15000, icon: Receipt },
  { name: 'Entertainment', value: 'ENTERTAINMENT', defaultTarget: 4000, icon: Film },
  { name: 'Health & Fitness', value: 'HEALTH', defaultTarget: 6000, icon: HeartPulse }
];

export const getCategoryIcon = (category: string) => {
  const norm = category.toUpperCase();
  if (norm.includes('GROCER')) return Utensils;
  if (norm.includes('ELECTR') || norm.includes('TECH') || norm.includes('GADGET')) return Laptop;
  if (norm.includes('FOOD') || norm.includes('DINE') || norm.includes('RESTAURANT')) return Utensils;
  if (norm.includes('SHOP') || norm.includes('CLOTH')) return ShoppingBag;
  if (norm.includes('TRAVEL') || norm.includes('CAB') || norm.includes('COMMUTE')) return Car;
  if (norm.includes('BILL') || norm.includes('RENT') || norm.includes('UTILITY')) return Receipt;
  if (norm.includes('ENTERTAIN') || norm.includes('MOVIE') || norm.includes('OTT')) return Film;
  if (norm.includes('HEALTH') || norm.includes('MEDIC') || norm.includes('GYM')) return HeartPulse;
  return Target;
};

const GoalsSection: React.FC<Props> = ({
  transactions,
  goals,
  activeAccountId,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAskAiAboutGoal
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('Groceries');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState('10000');
  const [formMonth, setFormMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [formNotes, setFormNotes] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Calculate actual spending for each goal
  const goalsWithProgress = useMemo(() => {
    const currentMonthExpenses = transactions.filter(
      t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth)
    );

    return goals.map(goal => {
      const goalCatNorm = goal.category.trim().toUpperCase();

      // Find transactions matching this category or keywords
      const matchingTx = currentMonthExpenses.filter(t => {
        const txCat = t.category.toUpperCase();
        const txPurpose = t.purpose.toUpperCase();
        const txProd = (t.shoppingDetails?.productName || '').toUpperCase();

        // Exact category enum match (e.g. GROCERY matches GROCERY or Groceries)
        if (goalCatNorm === 'GROCERY' || goalCatNorm === 'GROCERIES') {
          return txCat === 'GROCERY' || txPurpose.includes('BLINKIT') || txPurpose.includes('ZEPTO') || txPurpose.includes('INSTAMART') || txPurpose.includes('GROCER');
        }
        if (goalCatNorm === 'ELECTRONICS') {
          return txCat === 'ELECTRONICS' || 
            txPurpose.includes('PHONE') || txPurpose.includes('LAPTOP') || txPurpose.includes('HEADPHONE') ||
            txPurpose.includes('ELECTRONIC') || txProd.includes('PHONE') || txProd.includes('LAPTOP') ||
            (txCat === 'SHOPPING' && (txPurpose.includes('GADGET') || txPurpose.includes('CABLE') || txPurpose.includes('CHARGER')));
        }
        if (goalCatNorm === 'FOOD' || goalCatNorm === 'FOOD & DINING') {
          return txCat === 'FOOD' || txPurpose.includes('SWIGGY') || txPurpose.includes('ZOMATO') || txPurpose.includes('RESTAURANT');
        }
        if (goalCatNorm === 'SHOPPING') {
          return txCat === 'SHOPPING' || txPurpose.includes('AMAZON') || txPurpose.includes('FLIPKART') || txPurpose.includes('MYNTRA');
        }
        if (goalCatNorm === txCat) return true;

        // Fallback: match purpose containing category name
        return txPurpose.includes(goalCatNorm);
      });

      const spent = matchingTx.reduce((sum, t) => sum + t.amount, 0);
      const target = goal.targetAmount;
      const remaining = target - spent;
      const percentage = target > 0 ? Math.round((spent / target) * 100) : 0;
      const clampedPct = Math.min(percentage, 100);

      let status: 'SAFE' | 'WARNING' | 'EXCEEDED' = 'SAFE';
      if (percentage >= 100) status = 'EXCEEDED';
      else if (percentage >= 75) status = 'WARNING';

      return {
        ...goal,
        spent,
        remaining,
        percentage,
        clampedPct,
        status,
        txCount: matchingTx.length
      };
    });
  }, [goals, transactions, currentMonth]);

  // Overall totals
  const overallMetrics = useMemo(() => {
    const totalTarget = goalsWithProgress.reduce((s, g) => s + g.targetAmount, 0);
    const totalSpent = goalsWithProgress.reduce((s, g) => s + g.spent, 0);
    const netHeadroom = totalTarget - totalSpent;
    const overallPct = totalTarget > 0 ? Math.round((totalSpent / totalTarget) * 100) : 0;

    return { totalTarget, totalSpent, netHeadroom, overallPct };
  }, [goalsWithProgress]);

  const handleOpenAddModal = (presetCategory?: string, presetTarget?: number) => {
    setEditingGoal(null);
    setFormCategory(presetCategory || 'Groceries');
    setFormCustomCategory('');
    setFormTargetAmount(presetTarget ? presetTarget.toString() : '10000');
    setFormMonth(currentMonth);
    setFormNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    const matchingPreset = SUGGESTED_CATEGORIES.find(c => c.name.toLowerCase() === goal.category.toLowerCase() || c.value.toLowerCase() === goal.category.toLowerCase());
    if (matchingPreset) {
      setFormCategory(matchingPreset.name);
      setFormCustomCategory('');
    } else {
      setFormCategory('CUSTOM');
      setFormCustomCategory(goal.category);
    }
    setFormTargetAmount(goal.targetAmount.toString());
    setFormMonth(goal.month);
    setFormNotes(goal.notes || '');
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCategory = formCategory === 'CUSTOM' ? (formCustomCategory.trim() || 'Custom Goal') : formCategory;
    const numericTarget = parseFloat(formTargetAmount);

    if (isNaN(numericTarget) || numericTarget <= 0) {
      return;
    }

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, {
        category: resolvedCategory,
        targetAmount: numericTarget,
        month: formMonth,
        notes: formNotes.trim()
      });
    } else {
      onAddGoal({
        accountId: activeAccountId,
        category: resolvedCategory,
        targetAmount: numericTarget,
        month: formMonth,
        notes: formNotes.trim()
      });
    }

    setShowModal(false);
  };

  return (
    <section className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <Target size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-[var(--text-main)]">Monthly Savings Goals</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]">
                {currentMonthName}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Set spending limits for key categories to protect your monthly savings targets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus size={16} /> Set New Goal
          </button>
        </div>
      </div>

      {/* Overview Metric Ribbon (when goals exist) */}
      {goalsWithProgress.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 mb-6 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Budgeted</p>
            <p className="text-base font-bold font-mono text-[var(--text-main)] tabular-nums mt-0.5">
              ₹{overallMetrics.totalTarget.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Actual Spent</p>
            <p className="text-base font-bold font-mono text-rose-400 tabular-nums mt-0.5">
              ₹{overallMetrics.totalSpent.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Savings Buffer</p>
            <p className={`text-base font-bold font-mono tabular-nums mt-0.5 ${overallMetrics.netHeadroom >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {overallMetrics.netHeadroom >= 0 ? '+' : ''}₹{overallMetrics.netHeadroom.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Budget Consumed</p>
            <p className="text-base font-bold font-mono text-[var(--text-main)] tabular-nums mt-0.5">
              {overallMetrics.overallPct}%
            </p>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goalsWithProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalsWithProgress.map(g => {
            const Icon = getCategoryIcon(g.category);

            // Determine status bar styles
            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            let badgeText = 'On Track';

            if (g.status === 'EXCEEDED') {
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              badgeText = `Exceeded by ₹${Math.abs(g.remaining).toLocaleString()}`;
            } else if (g.status === 'WARNING') {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              badgeText = `${g.percentage}% Used`;
            }

            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col justify-between hover:border-amber-500/30 transition-all duration-200"
              >
                <div>
                  {/* Top line: Icon, Title, Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-amber-500">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-main)]">{g.category}</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {g.txCount} {g.txCount === 1 ? 'expense' : 'expenses'} logged this month
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(g)}
                        title="Edit target"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        title="Remove goal"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-[var(--bg-card)] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Numbers row */}
                  <div className="flex justify-between items-baseline mb-2 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)]">Spent: </span>
                      <span className="font-bold font-mono text-[var(--text-main)] tabular-nums">
                        ₹{g.spent.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Target: </span>
                      <span className="font-bold font-mono text-[var(--text-main)] tabular-nums">
                        ₹{g.targetAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border-color)] relative mb-3">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${g.clampedPct}%` }}
                    />
                  </div>

                  {/* Remaining / Status label */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {badgeText}
                    </span>

                    <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
                      {g.remaining >= 0 ? (
                        <>₹{g.remaining.toLocaleString()} buffer left</>
                      ) : (
                        <span className="text-rose-400 font-bold">Over limit</span>
                      )}
                    </span>
                  </div>

                  {g.notes && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-2 italic border-t border-[var(--border-color)]/50 pt-2">
                      "{g.notes}"
                    </p>
                  )}
                </div>

                {/* Ask AI button for this category */}
                {onAskAiAboutGoal && (
                  <div className="mt-4 pt-3 border-t border-[var(--border-color)]/50 flex justify-end">
                    <button
                      onClick={() => onAskAiAboutGoal(g.category, g.targetAmount, g.spent)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      <Sparkles size={12} /> Ask AI about this goal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State with Quick Presets */
        <div className="py-8 px-4 rounded-2xl bg-[var(--bg-input)] border border-dashed border-[var(--border-color)] text-center">
          <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl w-fit mx-auto mb-3 text-amber-500">
            <Target size={28} />
          </div>
          <h4 className="font-bold text-sm text-[var(--text-main)] mb-1">No Category Goals Set Yet</h4>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-5 leading-relaxed">
            Set monthly spending caps for high-frequency areas like Groceries or Electronics to curb impulse buying and hit your savings milestones.
          </p>

          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Quick-Start Recommended Goals:
          </p>

          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {SUGGESTED_CATEGORIES.slice(0, 4).map(preset => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  onClick={() => handleOpenAddModal(preset.name, preset.defaultTarget)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-amber-500/10 hover:border-amber-500/30 border border-[var(--border-color)] text-xs text-[var(--text-main)] transition-colors group"
                >
                  <Icon size={14} className="text-amber-500" />
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">₹{preset.defaultTarget.toLocaleString()}</span>
                  <Plus size={12} className="text-amber-500 opacity-60 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Target size={20} />
                </div>
                <h3 className="font-bold text-base text-[var(--text-main)]">
                  {editingGoal ? 'Update Savings Goal' : 'Set Category Savings Goal'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                >
                  {SUGGESTED_CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom Category Name</option>
                </select>
              </div>

              {formCategory === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomCategory}
                    onChange={e => setFormCustomCategory(e.target.value)}
                    placeholder="e.g. Subscriptions, Gaming, Coffee"
                    className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Monthly Spending Cap / Target Amount */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Monthly Spending Cap (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-[var(--text-muted)] font-mono">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    required
                    value={formTargetAmount}
                    onChange={e => setFormTargetAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full pl-8 pr-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Maximum you plan to spend in this category for the month. Spending less directly boosts your net savings.
                </p>
              </div>

              {/* Month */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Applicable Month
                </label>
                <input
                  type="month"
                  value={formMonth}
                  onChange={e => setFormMonth(e.target.value)}
                  className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Motivation / Notes */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Strategy / Target Note (Optional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Cut down Zepto midnight orders, wait for festive sale"
                  className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-sm transition-all"
                >
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default GoalsSection;
