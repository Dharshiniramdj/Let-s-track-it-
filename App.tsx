import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Account } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import SettingsModal from './components/SettingsModal';
import { generateMonthlyInsight } from './services/geminiService';
import { Home, List, Calendar as CalendarIcon, Plus, Lightbulb, Settings, Bell, ShoppingBag, FileText, PieChart, BarChart, User, Wallet, Check } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'STATS' | 'LOG' | 'CALENDAR'>('HOME');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'DEFAULT' | 'SHOPPING'>('DEFAULT');
  const [showInsight, setShowInsight] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // -- Data State --
  const [userName, setUserName] = useState(() => localStorage.getItem('lets_track_it_username') || 'Personal');
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('lets_track_it_accounts');
    return saved ? JSON.parse(saved) : [{ 
        id: 'default', 
        name: 'Personal', 
        type: 'PERSONAL', 
        color: 'amber', 
        avatarSeed: 'Felix' 
    }];
  });

  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
     return localStorage.getItem('lets_track_it_active_account') || accounts[0]?.id || 'default';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('lets_track_it_data');
    if (saved) {
        const loaded: Transaction[] = JSON.parse(saved);
        // Data Migration: Assign existing transactions to default account if missing ID
        return loaded.map(t => t.accountId ? t : { ...t, accountId: 'default' });
    }
    return [];
  });

  // -- Persistence Effects --
  useEffect(() => {
    localStorage.setItem('lets_track_it_data', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('lets_track_it_accounts', JSON.stringify(accounts));
    // If active account was deleted, switch to the first available
    if (!accounts.find(a => a.id === activeAccountId) && accounts.length > 0) {
        setActiveAccountId(accounts[0].id);
    }
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('lets_track_it_active_account', activeAccountId);
  }, [activeAccountId]);

  useEffect(() => {
    localStorage.setItem('lets_track_it_username', userName);
  }, [userName]);


  // -- Computed --
  const activeAccountTransactions = useMemo(() => {
    return transactions.filter(t => t.accountId === activeAccountId);
  }, [transactions, activeAccountId]);

  const activeAccountName = accounts.find(a => a.id === activeAccountId)?.name || 'Account';


  // -- Handlers --

  const openAddModal = (mode: 'DEFAULT' | 'SHOPPING' = 'DEFAULT') => {
      setAddModalMode(mode);
      setShowAddModal(true);
  };

  const addTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt' | 'accountId'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
      accountId: activeAccountId,
      createdAt: Date.now()
    };
    setTransactions(prev => [transaction, ...prev]);
    setShowAddModal(false);
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDeleteAccount = (id: string) => {
      // 1. Remove account
      setAccounts(prev => prev.filter(a => a.id !== id));
      // 2. Remove associated transactions
      setTransactions(prev => prev.filter(t => t.accountId !== id));
  };

  const handleGenerateInsight = async () => {
    setShowInsight(true);
    setLoadingInsight(true);
    const text = await generateMonthlyInsight(activeAccountTransactions);
    setInsightText(text);
    setLoadingInsight(false);
  };

  return (
    <div className="min-h-screen flex bg-[#121212] text-stone-200 overflow-hidden font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 bg-[#2E2C29] flex-shrink-0 flex-col h-screen p-6 relative rounded-r-3xl z-20 shadow-2xl border-r border-stone-800">
        
        {/* User Profile Section */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-stone-700 overflow-hidden border-2 border-amber-500/50">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg truncate max-w-[120px]">{userName}</h3>
            <p className="text-xs text-stone-400">Finance Manager</p>
          </div>
          <button 
            onClick={() => setShowSettingsModal(true)} 
            className="ml-auto text-stone-500 hover:text-white cursor-pointer p-2 hover:bg-stone-700 rounded-full transition-colors"
          >
             <Settings size={18} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-4 pl-2">Main Menu</p>
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('HOME')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'HOME' ? 'bg-[#3E3C39] text-amber-400 shadow-lg border-l-4 border-amber-500' : 'text-stone-400 hover:bg-[#3E3C39]/50 hover:text-stone-200'}`}
                >
                  <Home size={20} />
                  <span className="font-medium">Home</span>
                </button>

                <button 
                  onClick={() => setActiveTab('STATS')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'STATS' ? 'bg-[#3E3C39] text-amber-400 shadow-lg border-l-4 border-amber-500' : 'text-stone-400 hover:bg-[#3E3C39]/50 hover:text-stone-200'}`}
                >
                  <BarChart size={20} />
                  <span className="font-medium">Stats</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('LOG')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'LOG' ? 'bg-[#3E3C39] text-amber-400 shadow-lg border-l-4 border-amber-500' : 'text-stone-400 hover:bg-[#3E3C39]/50 hover:text-stone-200'}`}
                >
                  <List size={20} />
                  <span className="font-medium">Log</span>
                </button>

                <button 
                  onClick={() => setActiveTab('CALENDAR')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'CALENDAR' ? 'bg-[#3E3C39] text-amber-400 shadow-lg border-l-4 border-amber-500' : 'text-stone-400 hover:bg-[#3E3C39]/50 hover:text-stone-200'}`}
                >
                  <CalendarIcon size={20} />
                  <span className="font-medium">Calendar</span>
                </button>
              </nav>
          </div>

          <div>
             <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-4 pl-2">Smart Tools</p>
             <button onClick={handleGenerateInsight} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-stone-400 hover:bg-[#3E3C39]/50 hover:text-amber-300 transition-colors">
                <Lightbulb size={20} />
                <span className="font-medium">Smart Report</span>
              </button>
              <button onClick={() => openAddModal('DEFAULT')} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-stone-400 hover:bg-[#3E3C39]/50 hover:text-amber-300 transition-colors">
                <Plus size={20} />
                <span className="font-medium">Quick Add</span>
              </button>
          </div>
        </div>

        {/* Bottom Section: Accounts */}
        <div className="mt-auto pt-6 border-t border-stone-700/50">
           <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Select Account</p>
              <button onClick={() => setShowSettingsModal(true)} className="text-stone-500 hover:text-amber-500 transition-colors">
                 <Plus size={16} />
              </button>
           </div>
           <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {accounts.map(acc => (
                  <div 
                    key={acc.id}
                    onClick={() => setActiveAccountId(acc.id)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors border ${activeAccountId === acc.id ? 'bg-[#3E3C39] border-amber-500/30' : 'hover:bg-[#3E3C39]/30 border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${activeAccountId === acc.id ? 'bg-amber-500 text-black' : 'bg-stone-600 text-stone-300'}`}>
                        {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 truncate">
                        <p className={`text-sm font-bold truncate ${activeAccountId === acc.id ? 'text-white' : 'text-stone-300'}`}>{acc.name}</p>
                        <p className="text-[10px] text-stone-500 uppercase">{acc.type}</p>
                    </div>
                    {activeAccountId === acc.id && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                  </div>
              ))}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[#121212] pb-[calc(110px+env(safe-area-inset-bottom))] md:pb-0">
         {/* Top Header */}
         <div className="sticky top-0 z-10 px-6 py-4 md:px-8 md:py-6 bg-[#121212]/90 backdrop-blur-md flex justify-between items-center pt-[calc(1rem+env(safe-area-inset-top))] md:pt-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                {activeTab === 'HOME' && 'Overview'}
                {activeTab === 'STATS' && 'Reports'}
                {activeTab === 'LOG' && 'Transactions'}
                {activeTab === 'CALENDAR' && 'Timeline'}
              </h1>
              <p className="text-stone-500 text-xs hidden md:block flex items-center gap-2">
                 Account: <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{activeAccountName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
               {/* Mobile Account Switcher Trigger */}
               <button onClick={() => setShowSettingsModal(true)} className="md:hidden p-3 rounded-full bg-[#1E1E1E] text-stone-400 hover:text-white border border-stone-800">
                  <User size={20} />
               </button>

               <button onClick={handleGenerateInsight} className="md:hidden p-3 rounded-full bg-[#1E1E1E] text-stone-400 hover:text-white border border-stone-800">
                 <FileText size={20} />
               </button>
               
               <button className="p-3 rounded-full bg-[#1E1E1E] text-stone-400 hover:text-white relative border border-stone-800">
                  <Bell size={20} />
                  <span className="absolute top-2 right-3 w-2 h-2 bg-amber-500 rounded-full"></span>
               </button>
               <button 
                 onClick={() => openAddModal('DEFAULT')}
                 className="hidden md:flex bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-full font-bold shadow-lg shadow-amber-500/20 items-center gap-2 transition-all hover:scale-105"
               >
                 <Plus size={20} /> Add New
               </button>
            </div>
         </div>

         {/* Mobile Account Indicator */}
         <div className="md:hidden px-6 mb-4">
            <div onClick={() => setShowSettingsModal(true)} className="bg-[#1E1E1E] border border-stone-800 rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-98 transition-transform">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
                        {activeAccountName.charAt(0)}
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 uppercase">Current Account</p>
                        <p className="font-bold text-white">{activeAccountName}</p>
                    </div>
                </div>
                <Settings size={16} className="text-stone-500" />
            </div>
         </div>

         <div className="px-4 md:px-8 pb-10">
            {activeTab === 'HOME' && <Dashboard transactions={activeAccountTransactions} onQuickOrder={() => openAddModal('SHOPPING')} onViewStats={() => setActiveTab('STATS')} />}
            {activeTab === 'STATS' && <StatsView transactions={activeAccountTransactions} />}
            {activeTab === 'LOG' && <TransactionList transactions={activeAccountTransactions} onDelete={deleteTransaction} />}
            {activeTab === 'CALENDAR' && <CalendarView transactions={activeAccountTransactions} />}
         </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <TransactionForm 
              onSave={addTransaction} 
              onCancel={() => setShowAddModal(false)} 
              initialMode={addModalMode}
            />
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
            <SettingsModal 
                accounts={accounts}
                onClose={() => setShowSettingsModal(false)}
                onUpdateAccounts={setAccounts}
                onDeleteAccount={handleDeleteAccount}
                userName={userName}
                setUserName={setUserName}
            />
        )}

        {/* Insights Modal */}
        {showInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="bg-[#1E1E1E] rounded-3xl shadow-2xl p-8 max-w-lg w-full relative border border-stone-800">
               <button onClick={() => setShowInsight(false)} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors">
                  <Plus size={24} className="rotate-45" />
               </button>
               <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                 <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Lightbulb size={24} /></div>
                 Smart Spending Report
               </h3>
               <div className="prose prose-invert prose-sm text-stone-300 max-h-[60vh] overflow-y-auto leading-relaxed custom-scrollbar pr-2">
                 {loadingInsight ? (
                   <div className="flex flex-col items-center justify-center py-12">
                     <div className="w-10 h-10 border-4 border-stone-700 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                     <p className="text-stone-500 font-medium">AI is analyzing your spending habits...</p>
                   </div>
                 ) : (
                   <div className="whitespace-pre-line bg-[#121212] p-5 rounded-2xl border border-stone-800/50">{insightText}</div>
                 )}
               </div>
               <div className="mt-8 flex justify-end">
                   <button onClick={() => setShowInsight(false)} className="px-6 py-3 bg-stone-800 hover:bg-stone-700 rounded-xl text-white font-medium text-sm transition-colors">Close</button>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#2E2C29] border-t border-stone-800 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <button 
           onClick={() => setActiveTab('HOME')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'HOME' ? 'text-amber-500' : 'text-stone-500'}`}
         >
           <Home size={24} strokeWidth={activeTab === 'HOME' ? 2.5 : 2} />
         </button>
         
         <button 
           onClick={() => setActiveTab('STATS')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'STATS' ? 'text-amber-500' : 'text-stone-500'}`}
         >
           <BarChart size={24} strokeWidth={activeTab === 'STATS' ? 2.5 : 2} />
         </button>

         {/* Floating Main Action Button */}
         <div className="relative -top-8">
            <button 
              onClick={() => openAddModal('DEFAULT')}
              className="bg-amber-500 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] border-4 border-[#121212] hover:scale-105 transition-transform"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
         </div>

         <button 
           onClick={() => setActiveTab('LOG')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'LOG' ? 'text-amber-500' : 'text-stone-500'}`}
         >
           <List size={24} strokeWidth={activeTab === 'LOG' ? 2.5 : 2} />
         </button>

         <button 
           onClick={() => setActiveTab('CALENDAR')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'CALENDAR' ? 'text-amber-500' : 'text-stone-500'}`}
         >
           <CalendarIcon size={24} strokeWidth={activeTab === 'CALENDAR' ? 2.5 : 2} />
         </button>
      </nav>
    </div>
  );
};

export default App;