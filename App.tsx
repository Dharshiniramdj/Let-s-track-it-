import React, { useState, useEffect } from 'react';
import { Transaction } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import { generateMonthlyInsight } from './services/geminiService';
import { Home, List, Calendar as CalendarIcon, Plus, Lightbulb, Settings, Bell, ShoppingBag, FileText, PieChart, BarChart } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'STATS' | 'LOG' | 'CALENDAR'>('HOME');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'DEFAULT' | 'SHOPPING'>('DEFAULT');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showInsight, setShowInsight] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Load from Local Storage on Mount
  useEffect(() => {
    const saved = localStorage.getItem('lets_track_it_data');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // Save to Local Storage on Change
  useEffect(() => {
    localStorage.setItem('lets_track_it_data', JSON.stringify(transactions));
  }, [transactions]);

  const openAddModal = (mode: 'DEFAULT' | 'SHOPPING' = 'DEFAULT') => {
      setAddModalMode(mode);
      setShowAddModal(true);
  };

  const addTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
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

  const handleGenerateInsight = async () => {
    setShowInsight(true);
    setLoadingInsight(true);
    const text = await generateMonthlyInsight(transactions);
    setInsightText(text);
    setLoadingInsight(false);
  };

  return (
    <div className="min-h-screen flex bg-[#121212] text-stone-200 overflow-hidden font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 bg-[#2E2C29] flex-shrink-0 flex-col h-screen p-6 relative rounded-r-3xl z-20 shadow-2xl">
        
        {/* User Profile Section */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-stone-700 overflow-hidden border-2 border-amber-500/50">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">My Account</h3>
            <p className="text-xs text-stone-400">Smart Finance Manager</p>
          </div>
          <div className="ml-auto text-stone-500 hover:text-white cursor-pointer">
             <Settings size={18} />
          </div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-6 flex-1">
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

        {/* Bottom Section */}
        <div className="mt-auto pt-6 border-t border-stone-700/50">
           <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Select Account</p>
              <Plus size={14} className="text-stone-500 cursor-pointer" />
           </div>
           <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-[#3E3C39] rounded-xl cursor-pointer border border-amber-500/30">
                 <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xs">Me</div>
                 <div className="flex-1">
                    <p className="text-sm font-bold text-white">Personal</p>
                    <p className="text-[10px] text-stone-400">Active</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-[#3E3C39]/30 opacity-60">
                 <div className="w-8 h-8 rounded-full bg-stone-600 flex items-center justify-center text-white font-bold text-xs">Fa</div>
                 <div className="flex-1">
                    <p className="text-sm font-bold text-stone-300">Father</p>
                    <p className="text-[10px] text-stone-500">View Only</p>
                 </div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[#121212] pb-24 md:pb-0">
         {/* Top Header */}
         <div className="sticky top-0 z-10 px-6 py-4 md:px-8 md:py-6 bg-[#121212]/90 backdrop-blur-md flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                {activeTab === 'HOME' && 'Home Overview'}
                {activeTab === 'STATS' && 'Statistics & Reports'}
                {activeTab === 'LOG' && 'Log'}
                {activeTab === 'CALENDAR' && 'Timeline'}
              </h1>
              <p className="text-stone-500 text-xs hidden md:block">Smart tracking for smarter spending.</p>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
               <button onClick={handleGenerateInsight} className="md:hidden p-3 rounded-full bg-[#1E1E1E] text-stone-400 hover:text-white">
                 <FileText size={20} />
               </button>
               <button className="p-3 rounded-full bg-[#1E1E1E] text-stone-400 hover:text-white relative">
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

         <div className="px-4 md:px-8 pb-10">
            {activeTab === 'HOME' && <Dashboard transactions={transactions} onQuickOrder={() => openAddModal('SHOPPING')} onViewStats={() => setActiveTab('STATS')} />}
            {activeTab === 'STATS' && <StatsView transactions={transactions} />}
            {activeTab === 'LOG' && <TransactionList transactions={transactions} onDelete={deleteTransaction} />}
            {activeTab === 'CALENDAR' && <CalendarView transactions={transactions} />}
         </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <TransactionForm 
              onSave={addTransaction} 
              onCancel={() => setShowAddModal(false)} 
              initialMode={addModalMode}
            />
          </div>
        )}

        {/* Insights Modal */}
        {showInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#2E2C29] border-t border-stone-800 px-6 py-4 z-40 flex justify-