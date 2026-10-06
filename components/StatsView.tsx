import React, { useMemo, useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon, Download, FileText, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#F59E0B', '#D97706', '#92400E', '#78350F', '#451a03', '#525252', '#262626'];

const StatsView: React.FC<Props> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');
  const containerRef = useRef<HTMLDivElement>(null);

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

  const trendData = useMemo(() => {
    const daysToSubtract = timeRange === '7D' ? 6 : timeRange === '30D' ? 29 : 89;
    const result = [];
    
    for(let i = daysToSubtract; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayTx = transactions.filter(t => t.date === dateStr);
        const income = dayTx.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTx.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        
        const label = timeRange === '90D' 
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short' });
            
        const finalLabel = timeRange === '7D' ? label : d.getDate().toString();

        result.push({
            date: timeRange === '90D' ? label : finalLabel,
            fullDate: dateStr,
            income,
            expense
        });
    }
    return result;
  }, [transactions, timeRange]);

  const handleDownload = async () => {
    if (containerRef.current) {
        const canvas = await html2canvas(containerRef.current, { 
            backgroundColor: document.body.classList.contains('light-mode') ? '#F5F5F4' : '#121212',
            scale: 2
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `Spending_Report_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500" ref={containerRef}>
        {/* Header with Export */}
        <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                <FileText size={20} className="text-amber-500" />
                Performance Report
            </h2>
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-amber-500 hover:text-black transition-all shadow-sm active:scale-95"
            >
                <Download size={14} /> Export Report
            </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-emerald-500">
                    <TrendingUp size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Total Income</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-main)]">₹{stats.income.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-rose-500">
                    <TrendingDown size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Total Spent</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-main)]">₹{stats.expense.toLocaleString()}</p>
            </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Spending vs Income Trend */}
            <div className="dashboard-card p-6 bg-[var(--bg-card)] border border-[var(--border-color)] min-h-[350px] flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-main)]">Cash Flow</h3>
                        <p className="text-xs text-[var(--text-muted)]">Relative income vs expense</p>
                    </div>
                    <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg">
                        {(['7D', '30D', '90D'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${timeRange === range ? 'bg-amber-500 text-black shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                            <XAxis 
                                dataKey="date" 
                                tick={{fontSize: 9, fill: 'var(--text-muted)'}} 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10} 
                                interval={timeRange === '90D' ? 6 : timeRange === '30D' ? 4 : 0}
                            />
                            <Tooltip 
                                cursor={{stroke: 'var(--text-muted)', strokeWidth: 1}}
                                contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}
                                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                                formatter={(value: number, name: string) => [
                                    <span key="val" className="font-bold">₹{value.toLocaleString()}</span>, 
                                    name === 'income' ? 'Income' : 'Expense'
                                ]}
                            />
                            <Legend 
                                verticalAlign="top" 
                                align="right"
                                height={36} 
                                iconType="circle" 
                                content={(props) => (
                                    <div className="flex justify-end gap-3 text-[10px] font-bold mb-4">
                                        <div className="flex items-center gap-1 text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Income</div>
                                        <div className="flex items-center gap-1 text-rose-500"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Expense</div>
                                    </div>
                                )}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="income" 
                                stroke="#10B981" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#colorIncome)" 
                                animationDuration={1000}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="expense" 
                                stroke="#F43F5E" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#colorExpense)" 
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Pie Chart */}
            <div className="dashboard-card p-6 bg-[var(--bg-card)] border border-[var(--border-color)] min-h-[350px] flex flex-col shadow-sm">
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">Top Categories</h3>
                <div className="flex-1 w-full flex items-center justify-center min-h-0">
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationDuration={1000}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '11px' }}
                                    itemStyle={{ color: 'var(--text-main)' }} 
                                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={50} 
                                    iconType="circle"
                                    layout="horizontal"
                                    formatter={(value) => <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-[var(--text-muted)] text-sm flex flex-col items-center py-10">
                            <PieIcon size={40} className="mb-4 opacity-20"/>
                            <p className="font-medium">No spending logs found yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StatsView;