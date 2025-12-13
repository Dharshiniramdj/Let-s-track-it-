import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Wallet, ArrowUpRight, ArrowDownRight, ShoppingBag, Zap, CreditCard } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onQuickOrder: () => void;
  onViewStats: () => void;
}

const Dashboard: React.FC<Props> = ({ transactions, onQuickOrder, onViewStats }) => {
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

  const balance = stats.income - stats.expense;
  const recentTx = transactions.slice(0, 4);

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="dashboard-card p-6 bg-gradient-to-br from-[#1E1E1E] to-black border border-stone-800 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Wallet size={100} className="text-amber-500" />
                </div>
                <div className="relative z-10">
                    <p className="text-stone-400 text-sm font-medium mb-1">Total Balance</p>
                    <h2 className={`text-4xl font-bold mb-6 ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        ₹{balance.toLocaleString()}
                    </h2>
                    <div className="flex gap-6">
                        <div>
                             <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Income</p>
                             <p className="text-emerald-400 font-bold flex items-center gap-1">
                                <ArrowDownRight size={14} /> ₹{stats.income.toLocaleString()}
                             </p>
                        </div>
                        <div>
                             <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Expense</p>
                             <p className="text-rose-400 font-bold flex items-center gap-1">
                                <ArrowUpRight size={14} /> ₹{stats.expense.toLocaleString()}
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                 <div onClick={onQuickOrder} className="bg-amber-500 rounded-2xl p-5 cursor-pointer hover:bg-amber-400 transition-colors flex flex-col justify-between text-black shadow-lg shadow-amber-500/10">
                     <div className="bg-black/10 w-fit p-2 rounded-full"><ShoppingBag size={20} /></div>
                     <div>
                         <p className="font-bold text-lg">Quick Order</p>
                         <p className="text-xs opacity-70">Log purchase</p>
                     </div>
                 </div>
                 <div onClick={onViewStats} className="bg-[#262626] border border-stone-800 rounded-2xl p-5 cursor-pointer hover:border-amber-500/50 transition-colors flex flex-col justify-between text-white group">
                     <div className="bg-stone-800 w-fit p-2 rounded-full group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors"><Zap size={20} /></div>
                     <div>
                         <p className="font-bold text-lg">Analyze</p>
                         <p className="text-xs text-stone-400">View Stats</p>
                     </div>
                 </div>
            </div>
        </div>

        {/* Recent Transactions */}
        <div>
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-3">
                {recentTx.map(t => (
                    <div key={t.id} className="bg-[#1E1E1E] p-4 rounded-xl border border-stone-800 flex items-center justify-between hover:border-stone-700 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-stone-800 text-stone-400'}`}>
                                {t.type === TransactionType.INCOME ? <ArrowDownRight size={18} /> : 
                                 t.category === 'SHOPPING' ? <ShoppingBag size={18} /> : <CreditCard size={18} />}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{t.purpose}</p>
                                <p className="text-xs text-stone-500">{t.date} • {t.category}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-white'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}₹{t.amount.toLocaleString()}
                        </span>
                    </div>
                ))}
                {recentTx.length === 0 && <p className="text-stone-500 text-sm text-center py-8">No transactions yet.</p>}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
