import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Account, Category } from '../types';
import { Wallet, ArrowUpRight, ArrowDownRight, ShoppingBag, Zap, CreditCard, TrendingDown, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface Props {
  transactions: Transaction[];
  account?: Account;
  onQuickOrder: () => void;
  onViewStats: () => void;
}

const Dashboard: React.FC<Props> = ({ transactions, account, onQuickOrder, onViewStats }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('7D');

  const stats = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const spendingTrend = useMemo(() => {
    const data = [];
    const daysToSubtract = timeRange === '7D' ? 6 : timeRange === '30D' ? 29 : 89;
    
    for (let i = daysToSubtract; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Label formatting
        const dayName = timeRange === '7D' 
             ? d.toLocaleDateString('en-US', { weekday: 'short' })
             : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const amount = transactions
            .filter(t => t.date === dateStr && t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
            
        data.push({ name: dayName, amount, fullDate: dateStr });
    }
    return data;
  }, [transactions, timeRange]);

  // Calculate Budget Progress
  const budgetProgress = useMemo(() => {
    if (!account?.budgets) return [];

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const expensesByCategory: Record<string, number> = {};

    transactions.forEach(t => {
        if (t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth)) {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        }
    });

    return Object.entries(account.budgets)
        .filter(([_, limit]) => limit > 0)
        .map(([category, limit]) => {
            const spent = expensesByCategory[category] || 0;
            const percentage = Math.min((spent / limit) * 100, 100);
            return { category, limit, spent, percentage };
        })
        .sort((a, b) => b.percentage - a.percentage);
  }, [transactions, account]);

  const balance = stats.income - stats.expense;
  const recentTx = transactions.slice(0, 5);

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="dashboard-card p-6 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--border-color)] relative overflow-hidden group shadow-lg">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Wallet size={100} className="text-amber-500" />
                </div>
                <div className="relative z-10">
                    <p className="text-[var(--text-muted)] text-sm font-medium mb-1">Total Balance</p>
                    <h2 className={`text-4xl font-bold mb-6 ${balance >= 0 ? 'text-[var(--text-main)]' : 'text-red-400'}`}>
                        ₹{balance.toLocaleString()}
                    </h2>
                    <div className="flex gap-6">
                        <div>
                             <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Income</p>
                             <p className="text-emerald-400 font-bold flex items-center gap-1">
                                <ArrowDownRight size={14} /> ₹{stats.income.toLocaleString()}
                             </p>
                        </div>
                        <div>
                             <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Expense</p>
                             <p className="text-rose-400 font-bold flex items-center gap-1">
                                <ArrowUpRight size={14} /> ₹{stats.expense.toLocaleString()}
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spending Graph & Actions */}
            <div className="flex flex-col gap-4">
                {/* Spending Graph */}
                <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col min-h-[220px]">
                    <div className="flex flex-row justify-between items-center mb-4 gap-3">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-sm">
                            <div className="p-1 bg-rose-500/10 rounded-md text-rose-500"><TrendingDown size={14} /></div>
                            <span>Spending Analysis</span>
                        </div>
                        
                        {/* Range Toggle */}
                        <div className="flex bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-color)]">
                            {(['7D', '30D', '90D'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all ${timeRange === range ? 'bg-amber-500 text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={spendingTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                <Tooltip 
                                    cursor={{fill: 'var(--bg-secondary)'}}
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '12px' }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spent']}
                                    labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                                />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#78716c'}} 
                                    dy={10} 
                                    interval={timeRange === '90D' ? 6 : timeRange === '30D' ? 3 : 0}
                                />
                                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                    {spendingTrend.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#fb7185' : '#333'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4 h-24">
                     <div onClick={onQuickOrder} className="bg-amber-500 rounded-2xl p-4 cursor-pointer hover:bg-amber-400 transition-colors flex flex-col justify-center items-center text-black shadow-lg shadow-amber-500/10 gap-2 active:scale-95 duration-200">
                         <div className="bg-black/10 p-2 rounded-full"><ShoppingBag size={18} /></div>
                         <p className="font-bold text-sm">Log Order</p>
                     </div>
                     <div onClick={onViewStats} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors flex flex-col justify-center items-center text-[var(--text-main)] gap-2 group active:scale-95 duration-200">
                         <div className="bg-[var(--bg-input)] p-2 rounded-full group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors"><Zap size={18} /></div>
                         <p className="font-bold text-sm">Full Report</p>
                     </div>
                </div>
            </div>
        </div>

        {/* Budget Progress Section */}
        {budgetProgress.length > 0 && (
            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[var(--bg-secondary)] rounded-lg text-amber-500"><Target size={18} /></div>
                    <h3 className="font-bold text-[var(--text-main)]">Monthly Budgets</h3>
                 </div>
                 <div className="space-y-4">
                     {budgetProgress.map(item => {
                         let color = 'bg-emerald-500';
                         if (item.percentage >= 85) color = 'bg-rose-500';
                         else if (item.percentage >= 50) color = 'bg-amber-500';
                         
                         return (
                            <div key={item.category}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-[var(--text-main)]">{item.category}</span>
                                    <span className="text-xs font-mono text-[var(--text-muted)]">
                                        ₹{item.spent.toLocaleString()} / <span className="text-[var(--text-main)]">₹{item.limit.toLocaleString()}</span>
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                    <div 
                                        className={`h-full ${color} transition-all duration-500`} 
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                                {item.percentage >= 85 && (
                                    <p className="text-[10px] text-rose-500 mt-1 font-bold">⚠️ Approaching Limit</p>
                                )}
                            </div>
                         );
                     })}
                 </div>
            </div>
        )}

        {/* Recent Transactions */}
        <div>
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-[var(--text-main)]">Recent Activity</h3>
            </div>
            <div className="space-y-3">
                {recentTx.map(t => (
                    <div key={t.id} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between hover:border-[var(--text-muted)] transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                                {t.type === TransactionType.INCOME ? <ArrowDownRight size={18} /> : 
                                 t.category === 'SHOPPING' ? <ShoppingBag size={18} /> : <CreditCard size={18} />}
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-main)] text-sm">{t.purpose}</p>
                                <p className="text-xs text-[var(--text-muted)]">{t.date} • {t.category}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}₹{t.amount.toLocaleString()}
                        </span>
                    </div>
                ))}
                {recentTx.length === 0 && <p className="text-[var(--text-muted)] text-sm text-center py-8">No transactions yet.</p>}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;