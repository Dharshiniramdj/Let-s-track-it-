import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, Package, CreditCard } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

const CalendarView: React.FC<Props> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

    return { transactions: dayTransactions, deliveries: dayDeliveries, totalSpent };
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const yearName = currentDate.getFullYear();
  const today = new Date();

  return (
    <div className="dashboard-card p-6 border border-stone-800 bg-[#1E1E1E] text-stone-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-amber-500">{monthName}</span>
            <span className="text-stone-600 font-light">{yearName}</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-white"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-white"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-stone-800 border border-stone-800 rounded-2xl overflow-hidden shadow-inner">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-[#262626] p-3 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">
            {d}
          </div>
        ))}

        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} className="bg-[#121212]/50 h-32" />
        ))}

        {days.map((day) => {
          const { transactions, deliveries, totalSpent } = getDayContent(day);
          const isTodayDate = isSameDay(day, today);

          return (
            <div key={day.toISOString()} className="bg-[#1E1E1E] h-32 p-2 border-t border-l border-transparent hover:bg-stone-800 transition-all relative group flex flex-col">
              <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-amber-500 text-black shadow-lg font-bold' : 'text-stone-500'}`}>
                {day.getDate()}
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                {totalSpent > 0 && (
                    <div className="text-[10px] text-stone-300 font-bold flex items-center gap-1 bg-[#121212] px-2 py-1 rounded border border-stone-800">
                        <CreditCard size={10} className="text-stone-500" /> -{totalSpent.toLocaleString()}
                    </div>
                )}
                {deliveries.map(d => (
                    <div key={d.id} className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded flex items-center gap-1 truncate border border-amber-500/20" title={`Delivery: ${d.shoppingDetails?.productName}`}>
                        <Package size={10} /> {d.shoppingDetails?.productName}
                    </div>
                ))}
                 {/* Show count if too many */}
                 {transactions.length > 2 && (
                    <div className="text-[10px] text-stone-600 text-center font-medium mt-1">
                        +{transactions.length - 2} more items
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;