import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Account, UserProfile, AISettings, AppData, TransactionType } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import AdvisorView from './components/AdvisorView';
import SettingsModal from './components/SettingsModal';
import NotificationsPanel from './components/NotificationsPanel';
import { Home, List, Calendar as CalendarIcon, Plus, Settings, Bell, BarChart, User, Sparkles, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'STATS' | 'LOG' | 'CALENDAR' | 'ADVISOR'>('HOME');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'DEFAULT' | 'SHOPPING'>('DEFAULT');
  const [theme, setTheme] = useState<'DARK' | 'LIGHT'>(() => (localStorage.getItem('lets_track_it_theme') as 'DARK'|'LIGHT') || 'DARK');
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  
  // -- Data State --
  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
      const saved = localStorage.getItem('lets_track_it_profile');
      return saved ? JSON.parse(saved) : { name: 'Personal', email: '', phone: '', isVerified: false, avatarSeed: 'Felix' };
  });

  // AI Settings
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
      const saved = localStorage.getItem('lets_track_it_ai_settings');
      return saved ? JSON.parse(saved) : { persona: 'PROFESSIONAL', monthlyBudgetAlert: true, autoCategorize: true };
  });

  // Accounts
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
        return loaded.map(t => t.accountId ? t : { ...t, accountId: 'default' });
    }
    return [];
  });

  // -- Persistence Effects --
  useEffect(() => { localStorage.setItem('lets_track_it_data', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('lets_track_it_accounts', JSON.stringify(accounts)); 
    if (!accounts.find(a => a.id === activeAccountId) && accounts.length > 0) setActiveAccountId(accounts[0].id);
  }, [accounts]);
  useEffect(() => { localStorage.setItem('lets_track_it_active_account', activeAccountId); }, [activeAccountId]);
  useEffect(() => { localStorage.setItem('lets_track_it_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('lets_track_it_ai_settings', JSON.stringify(aiSettings)); }, [aiSettings]);
  
  // Theme Effect
  useEffect(() => {
    localStorage.setItem('lets_track_it_theme', theme);
    if (theme === 'LIGHT') document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
  }, [theme]);

  // -- Computed --
  const activeAccountTransactions = useMemo(() => {
    return transactions.filter(t => t.accountId === activeAccountId);
  }, [transactions, activeAccountId]);

  const activeAccountName = accounts.find(a => a.id === activeAccountId)?.name || 'Account';

  // Calculate notification count (Basic Logic)
  const notificationCount = useMemo(() => {
     let count = 0;
     const todayStr = new Date().toISOString().split('T')[0];
     // 1. If logged today, that's a summary notification
     if (transactions.some(t => t.date === todayStr)) count++;
     else count++; // Reminder notification
     
     // 2. Overspending check
     const totalIncome = transactions.reduce((s,t) => s + (t.type === TransactionType.INCOME ? t.amount : 0), 0);
     const totalExpense = transactions.reduce((s,t) => s + (t.type === TransactionType.EXPENSE ? t.amount : 0), 0);
     if (totalExpense > totalIncome && totalIncome > 0) count++;

     // 3. Deliveries
     const deliveries = transactions.filter(t => t.shoppingDetails && (t.shoppingDetails.status === 'ORDERED'));
     if (deliveries.length > 0) count++;
     
     return count;
  }, [transactions]);

  // -- Handlers --
  const openAddModal = (mode: 'DEFAULT' | 'SHOPPING' = 'DEFAULT') => {
      setEditingTransaction(undefined); // Clear edit state
      setAddModalMode(mode);
      setShowAddModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
      setEditingTransaction(transaction);
      setShowAddModal(true);
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt' | 'accountId'>) => {
    if (editingTransaction) {
        // Update existing
        setTransactions(prev => prev.map(t => 
            t.id === editingTransaction.id 
            ? { ...txData, id: t.id, createdAt: t.createdAt, accountId: t.accountId } 
            : t
        ));
    } else {
        // Create new
        const transaction: Transaction = {
            ...txData,
            id: crypto.randomUUID(),
            accountId: activeAccountId,
            createdAt: Date.now()
        };
        setTransactions(prev => [transaction, ...prev]);
    }
    setShowAddModal(false);
    setEditingTransaction(undefined);
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDeleteAccount = (id: string) => {
      setAccounts(prev => prev.filter(a => a.id !== id));
      setTransactions(prev => prev.filter(t => t.accountId !== id));
  };

  // -- Backup & Restore Logic --
  const handleExportData = () => {
      const data: AppData = {
          version: 1,
          profile: userProfile,
          accounts,
          transactions,
          aiSettings
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LetsTrackIt_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string) as AppData;
              if (data.version && data.transactions && data.accounts) {
                  setUserProfile(data.profile || userProfile);
                  setAccounts(data.accounts);
                  setTransactions(data.transactions);
                  if(data.aiSettings) setAiSettings(data.aiSettings);
                  alert("Data imported successfully!");
                  setShowSettingsModal(false);
              } else {
                  alert("Invalid backup file format.");
              }
          } catch (error) {
              console.error(error);
              alert("Failed to parse the backup file.");
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 bg-[var(--bg-card)] flex-shrink-0 flex-col h-screen p-6 relative rounded-r-3xl z-20 shadow-2xl border-r border-[var(--border-color)]">
        
        {/* User Profile Section */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-stone-700 overflow-hidden border-2 border-amber-500/50">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.avatarSeed || userProfile.name}`} alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-lg truncate max-w-[120px]">{userProfile.name}</h3>
            <p className="text-xs text-[var(--text-muted)]">Finance Manager</p>
          </div>
          <button 
            onClick={() => setShowSettingsModal(true)} 
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
          >
             <Settings size={18} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 pl-2">Main Menu</p>
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('HOME')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'HOME' ? 'bg-[var(--bg-secondary)] text-amber-500 shadow-sm border-l-4 border-amber-500' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-main)]'}`}
                >
                  <Home size={20} />
                  <span className="font-medium">Home</span>
                </button>

                <button 
                  onClick={() => setActiveTab('STATS')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'STATS' ? 'bg-[var(--bg-secondary)] text-amber-500 shadow-sm border-l-4 border-amber-500' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-main)]'}`}
                >
                  <BarChart size={20} />
                  <span className="font-medium">Stats</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('LOG')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'LOG' ? 'bg-[var(--bg-secondary)] text-amber-500 shadow-sm border-l-4 border-amber-500' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-main)]'}`}
                >
                  <List size={20} />
                  <span className="font-medium">Log</span>
                </button>

                <button 
                  onClick={() => setActiveTab('CALENDAR')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'CALENDAR' ? 'bg-[var(--bg-secondary)] text-amber-500 shadow-sm border-l-4 border-amber-500' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-main)]'}`}
                >
                  <CalendarIcon size={20} />
                  <span className="font-medium">Calendar</span>
                </button>
              </nav>
          </div>

          <div>
             <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 pl-2">Smart Tools</p>
             <button 
                onClick={() => setActiveTab('ADVISOR')} 
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'ADVISOR' ? 'bg-[var(--bg-secondary)] text-amber-500 shadow-sm border-l-4 border-amber-500' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50 hover:text-[var(--text-main)]'}`}
             >
                <BrainCircuit size={20} />
                <span className="font-medium">Advisor</span>
             </button>
              <button onClick={() => openAddModal('DEFAULT')} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/50 hover:text-amber-500 transition-colors">
                <Plus size={20} />
                <span className="font-medium">Quick Add</span>
              </button>
          </div>
        </div>

        {/* Bottom Section: Accounts */}
        <div className="mt-auto pt-6 border-t border-[var(--border-color)]">
           <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Select Account</p>
              <button onClick={() => setShowSettingsModal(true)} className="text-[var(--text-muted)] hover:text-amber-500 transition-colors">
                 <Plus size={16} />
              </button>
           </div>
           <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {accounts.map(acc => (
                  <div 
                    key={acc.id}
                    onClick={() => setActiveAccountId(acc.id)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors border ${activeAccountId === acc.id ? 'bg-[var(--bg-secondary)] border-amber-500/30' : 'hover:bg-[var(--bg-secondary)]/50 border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${activeAccountId === acc.id ? 'bg-amber-500 text-black' : 'bg-stone-600 text-stone-300'}`}>
                        {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 truncate">
                        <p className={`text-sm font-bold truncate ${activeAccountId === acc.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{acc.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase">{acc.type}</p>
                    </div>
                    {activeAccountId === acc.id && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                  </div>
              ))}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[var(--bg-main)] pb-[calc(110px+env(safe-area-inset-bottom))] md:pb-0">
         {/* Top Header */}
         <div className="sticky top-0 z-10 px-6 py-4 md:px-8 md:py-6 bg-[var(--bg-main)]/90 backdrop-blur-md flex justify-between items-center pt-[calc(1rem+env(safe-area-inset-top))] md:pt-6 border-b border-transparent md:border-[var(--border-color)]">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text-main)] mb-1">
                {activeTab === 'HOME' && 'Overview'}
                {activeTab === 'STATS' && 'Reports'}
                {activeTab === 'LOG' && 'Transactions'}
                {activeTab === 'CALENDAR' && 'Timeline'}
                {activeTab === 'ADVISOR' && 'AI Advisor'}
              </h1>
              <p className="text-[var(--text-muted)] text-xs hidden md:block flex items-center gap-2">
                 Account: <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{activeAccountName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
               {/* Mobile Account Switcher Trigger */}
               <button onClick={() => setShowSettingsModal(true)} className="md:hidden p-3 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]">
                  <User size={20} />
               </button>
               
               {/* Notification Bell with Logic */}
               <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-3 rounded-full border transition-all ${showNotifications ? 'bg-amber-500 text-black border-amber-500' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border-color)]'}`}
                 >
                    <Bell size={20} fill={showNotifications ? 'currentColor' : 'none'} />
                    {notificationCount > 0 && !showNotifications && <span className="absolute top-2 right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
                 </button>
                 {showNotifications && (
                    <NotificationsPanel 
                        transactions={activeAccountTransactions} 
                        onClose={() => setShowNotifications(false)} 
                    />
                 )}
               </div>

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
            <div onClick={() => setShowSettingsModal(true)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-98 transition-transform">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs">
                        {activeAccountName.charAt(0)}
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase">Current Account</p>
                        <p className="font-bold text-[var(--text-main)]">{activeAccountName}</p>
                    </div>
                </div>
                <Settings size={16} className="text-[var(--text-muted)]" />
            </div>
         </div>

         <div className="px-4 md:px-8 pb-10">
            {activeTab === 'HOME' && <Dashboard transactions={activeAccountTransactions} onQuickOrder={() => openAddModal('SHOPPING')} onViewStats={() => setActiveTab('STATS')} />}
            {activeTab === 'STATS' && <StatsView transactions={activeAccountTransactions} />}
            {activeTab === 'LOG' && <TransactionList transactions={activeAccountTransactions} onDelete={deleteTransaction} onEdit={handleEditTransaction} />}
            {activeTab === 'CALENDAR' && <CalendarView transactions={activeAccountTransactions} />}
            {activeTab === 'ADVISOR' && <AdvisorView transactions={activeAccountTransactions} aiSettings={aiSettings} />}
         </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <TransactionForm 
              onSave={handleSaveTransaction} 
              onCancel={() => { setShowAddModal(false); setEditingTransaction(undefined); }}
              initialMode={addModalMode}
              initialData={editingTransaction}
            />
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
            <SettingsModal 
                theme={theme}
                setTheme={setTheme}
                accounts={accounts}
                userProfile={userProfile}
                aiSettings={aiSettings}
                onClose={() => setShowSettingsModal(false)}
                onUpdateAccounts={setAccounts}
                onUpdateProfile={setUserProfile}
                onUpdateAiSettings={setAiSettings}
                onDeleteAccount={handleDeleteAccount}
                onExportData={handleExportData}
                onImportData={handleImportData}
            />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
         <button 
           onClick={() => setActiveTab('HOME')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'HOME' ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}
         >
           <Home size={24} strokeWidth={activeTab === 'HOME' ? 2.5 : 2} />
         </button>
         
         <button 
           onClick={() => setActiveTab('STATS')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'STATS' ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}
         >
           <BarChart size={24} strokeWidth={activeTab === 'STATS' ? 2.5 : 2} />
         </button>

         {/* Floating Main Action Button */}
         <div className="relative -top-8">
            <button 
              onClick={() => openAddModal('DEFAULT')}
              className="bg-amber-500 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] border-4 border-[var(--bg-main)] hover:scale-105 transition-transform"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
         </div>
         
         <button 
           onClick={() => setActiveTab('ADVISOR')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'ADVISOR' ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}
         >
           <BrainCircuit size={24} strokeWidth={activeTab === 'ADVISOR' ? 2.5 : 2} />
         </button>

         <button 
           onClick={() => setActiveTab('CALENDAR')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'CALENDAR' ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}
         >
           <CalendarIcon size={24} strokeWidth={activeTab === 'CALENDAR' ? 2.5 : 2} />
         </button>
      </nav>
    </div>
  );
};

export default App;