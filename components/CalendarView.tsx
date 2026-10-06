import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, Package, CreditCard, X, ArrowUpRight, ArrowDownRight, ShoppingBag } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

const CalendarView: React.FC<Props> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const startDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const paddingDays = Array(startDayIndex).fill(null);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getDayContent = (day: Date) => {
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    const dayStr = `${year}-${month}-${d}`;

    const dayTransactions = transactions.filter(t => t.date === dayStr);
    const dayDeliveries = transactions.filter(t => 
        t.shoppingDetails && 
        t.shoppingDetails.deliveryDate === dayStr
    );

    const totalSpent = dayTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

    return { transactions: dayTransactions, deliveries: dayDeliveries, totalSpent, dayStr };
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const yearName = currentDate.getFullYear();
  const today = new Date();

  const selectedDayTransactions = transactions.filter(t => t.date === selectedDay);

  return (
    <div className="relative">
        <div className="dashboard-card p-6 border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span className="text-amber-500">{monthName}</span>
                    <span className="text-[var(--text-muted)] font-light">{yearName}</span>
                </h2>
                <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"><ChevronLeft size={20} /></button>
                <button onClick={nextMonth} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-[var(--border-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-inner">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-[var(--bg-secondary)] p-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {d}
                </div>
                ))}

                {paddingDays.map((_, i) => (
                <div key={`padding-${i}`} className="bg-[var(--bg-main)]/50 h-24 md:h-32" />
                ))}

                {days.map((day) => {
                const { transactions: dayTransactions, deliveries, totalSpent, dayStr } = getDayContent(day);
                const isTodayDate = isSameDay(day, today);
                const hasData = dayTransactions.length > 0 || deliveries.length > 0;

                return (
                    <div 
                        key={day.toISOString()} 
                        onClick={() => hasData && setSelectedDay(dayStr)}
                        className={`bg-[var(--bg-card)] h-24 md:h-32 p-2 border-t border-l border-transparent transition-all relative group flex flex-col cursor-pointer ${hasData ? 'hover:bg-[var(--bg-secondary)] active:scale-95' : 'opacity-60 grayscale'}`}
                    >
                    <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-amber-500 text-black shadow-lg font-bold' : 'text-[var(--text-muted)]'}`}>
                        {day.getDate()}
                    </div>
                    
                    <div className="flex-1 overflow-hidden space-y-1 mt-1">
                        {totalSpent > 0 && (
                            <div className="text-[9px] md:text-[10px] text-[var(--text-main)] font-bold flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10 truncate">
                                -₹{totalSpent.toLocaleString()}
                            </div>
                        )}
                        {deliveries.length > 0 && (
                            <div className="text-[9px] md:text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded flex items-center gap-1 truncate border border-amber-500/20">
                                <Package size={10} className="shrink-0" /> {deliveries.length} Order{deliveries.length > 1 ? 's' : ''}
                            </div>
                        )}
                        {dayTransactions.some(t => t.type === TransactionType.INCOME) && (
                             <div className="text-[9px] md:text-[10px] text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 truncate">
                                <ArrowDownRight size={10} className="shrink-0" /> Income
                            </div>
                        )}
                    </div>
                    </div>
                );
                })}
            </div>
        </div>

        {/* Selected Day Modal */}
        {selectedDay && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                    <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--text-main)]">Transactions</h3>
                            <p className="text-sm text-amber-500 font-bold">{new Date(selectedDay).toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
                        </div>
                        <button onClick={() => setSelectedDay(null)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        {selectedDayTransactions.map(t => (
                            <div key={t.id} className="bg-[var(--bg-main)]/50 p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {t.type === TransactionType.INCOME ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--text-main)]">{t.purpose}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">{t.category}</span>
                                            <span className="text-[10px] text-[var(--text-muted)]">•</span>
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase">{t.mode}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-[var(--text-main)]'}`}>
                                        {t.type === TransactionType.INCOME ? '+' : '-'}₹{t.amount.toLocaleString()}
                                    </p>
                                    {t.shoppingDetails && (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1 justify-end">
                                            <ShoppingBag size={10} /> Online Order
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-[var(--bg-secondary)]/10 text-center border-t border-[var(--border-color)]">
                        <p className="text-xs text-[var(--text-muted)]">
                            Total for day: <span className="text-[var(--text-main)] font-bold">₹{selectedDayTransactions.reduce((acc, t) => acc + (t.type === TransactionType.EXPENSE ? t.amount : 0), 0).toLocaleString()} spent</span>
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CalendarView;