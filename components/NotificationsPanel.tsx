import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, AlertTriangle, TrendingUp, Info, Package, Wallet } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onClose: () => void;
}

const NotificationsPanel: React.FC<Props> = ({ transactions, onClose }) => {
  const alerts = useMemo(() => {
    const list = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // 1. Daily Summary
    const todayTx = transactions.filter(t => t.date === todayStr);
    if (todayTx.length > 0) {
        const spentToday = todayTx.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
        list.push({
            id: 'daily',
            title: 'Daily Summary',
            message: `You've spent ₹${spentToday.toLocaleString()} today across ${todayTx.length} transactions.`,
            type: 'info',
            icon: <Wallet size={16} className="text-blue-500" />,
            time: 'Today'
        });
    } else {
        list.push({
            id: 'reminder',
            title: 'Log Activity',
            message: "You haven't logged any transactions today yet.",
            type: 'neutral',
            icon: <Info size={16} className="text-[var(--text-muted)]" />,
            time: 'Now'
        });
    }

    // 2. Budget Alert (Simple: Expense > Income)
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    
    if (totalExpense > totalIncome && totalIncome > 0) {
        list.push({
            id: 'budget',
            title: 'Overspending Alert',
            message: `Expenses (₹${totalExpense.toLocaleString()}) have exceeded your total income.`,
            type: 'danger',
            icon: <AlertTriangle size={16} className="text-rose-500" />,
            time: 'Action Needed'
        });
    }

    // 3. Pending Deliveries
    const deliveries = transactions.filter(t => 
        t.shoppingDetails && 
        (t.shoppingDetails.status === 'ORDERED' || t.shoppingDetails.status === 'SHIPPED')
    );
    
    if (deliveries.length > 0) {
        list.push({
            id: 'delivery',
            title: 'Incoming Deliveries',
            message: `You have ${deliveries.length} active orders waiting to be delivered.`,
            type: 'success',
            icon: <Package size={16} className="text-amber-500" />,
            time: 'Update Status'
        });
    }

    return list;
  }, [transactions]);

  return (
    <div className="absolute top-14 right-0 w-80 md:w-96 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right">
       {/* Header */}
       <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30 backdrop-blur-sm">
           <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
            Notifications 
            <span className="bg-amber-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">{alerts.length}</span>
           </h3>
           <button onClick={onClose} className="p-1 hover:bg-[var(--bg-secondary)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X size={16} />
           </button>
       </div>

       {/* List */}
       <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
           {alerts.map(alert => (
               <div key={alert.id} className="p-3 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors flex gap-3 group cursor-default">
                   <div className={`mt-1 p-2 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] h-fit shrink-0`}>
                       {alert.icon}
                   </div>
                   <div className="flex-1">
                       <div className="flex justify-between items-start">
                           <p className="text-sm font-bold text-[var(--text-main)]">{alert.title}</p>
                           <span className="text-[10px] text-[var(--text-muted)] font-medium bg-[var(--bg-input)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">{alert.time}</span>
                       </div>
                       <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed group-hover:text-[var(--text-main)] transition-colors">
                           {alert.message}
                       </p>
                   </div>
               </div>
           ))}
           {alerts.length === 0 && (
               <div className="py-8 text-center text-[var(--text-muted)] text-xs">
                   No new notifications.
               </div>
           )}
       </div>
       
       <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/10 text-center">
            <button onClick={onClose} className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">
                Mark all as read
            </button>
       </div>
    </div>
  );
};

export default NotificationsPanel;