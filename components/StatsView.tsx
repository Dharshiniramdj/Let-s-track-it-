import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#F59E0B', '#D97706', '#92400E', '#78350F', '#451a03', '#525252', '#262626'];

const StatsView: React.FC<Props> = ({ transactions }) => {
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

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === TransactionType.EXPENSE) {
        data[t.category] = (data[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const dailyData = useMemo(() => {
    const result = [];
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTransactions = transactions.filter(t => t.date === dateStr && t.type === TransactionType.EXPENSE);
        const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        result.push({
            date: dateStr.slice(5),
            amount: total
        });
    }
    return result;
  }, [transactions]);

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-emerald-500">
                    <TrendingUp size={18} />
                    <span className="text-xs font-bold uppercase">Income</span>
                </div>
                <p className="text-xl font-bold text-white">₹{stats.income.toLocaleString()}</p>
            </div>
            <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-rose-500">
                    <TrendingDown size={18} />
                    <span className="text-xs font-bold uppercase">Expenses</span>
                </div>
                <p className="text-xl font-bold text-white">₹{stats.expense.toLocaleString()}</p>
            </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Spending Trend */}
            <div className="dashboard-card p-6 bg-[#1E1E1E] border border-stone-800 min-h-[300px]">
                <h3 className="text-lg font-bold text-white mb-6">Spending Trend (7 Days)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyData}>
                            <defs>
                                <linearGradient id="colorStatsSplit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} dy={10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: '12px', border: '1px solid #333', color: '#fff' }}
                                itemStyle={{ color: '#F59E0B' }}
                                formatter={(value: number) => `₹${value}`} 
                            />
                            <Area type="monotone" dataKey="amount" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorStatsSplit)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Pie Chart */}
            <div className="dashboard-card p-6 bg-[#1E1E1E] border border-stone-800 min-h-[300px]">
                <h3 className="text-lg font-bold text-white mb-6">Category Breakdown</h3>
                <div className="h-64 w-full flex items-center justify-center">
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: '12px', border: '1px solid #333', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }} 
                                    formatter={(value: number) => `₹${value}`}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs text-stone-400 ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-stone-500 text-sm flex flex-col items-center">
                            <PieIcon size={32} className="mb-2 opacity-50"/>
                            No expense data yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StatsView;
