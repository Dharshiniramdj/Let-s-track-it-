import React, { useState } from 'react';
import { Account } from '../types';
import { X, User, CreditCard, Trash2, Plus, AlertTriangle, Check, Wallet } from 'lucide-react';

interface Props {
  accounts: Account[];
  onClose: () => void;
  onUpdateAccounts: (accounts: Account[]) => void;
  onDeleteAccount: (id: string) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const SettingsModal: React.FC<Props> = ({ accounts, onClose, onUpdateAccounts, onDeleteAccount, userName, setUserName }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ACCOUNTS'>('ACCOUNTS');
  const [newAccountName, setNewAccountName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: newAccountName,
      type: 'PERSONAL',
      color: 'amber',
      avatarSeed: Math.random().toString(36).substring(7)
    };
    
    onUpdateAccounts([...accounts, newAccount]);
    setNewAccountName('');
  };

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setEditName(acc.name);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const updated = accounts.map(a => a.id === editingId ? { ...a, name: editName } : a);
    onUpdateAccounts(updated);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-[#1E1E1E] rounded-3xl shadow-2xl w-full max-w-2xl border border-stone-800 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-stone-800">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-1/3 border-r border-stone-800 p-4 space-y-2 bg-[#181818]">
                <button 
                    onClick={() => setActiveTab('ACCOUNTS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ACCOUNTS' ? 'bg-amber-500 text-black font-bold' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
                >
                    <CreditCard size={18} /> Accounts
                </button>
                <button 
                    onClick={() => setActiveTab('PROFILE')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'PROFILE' ? 'bg-amber-500 text-black font-bold' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
                >
                    <User size={18} /> Profile
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#121212]">
                
                {activeTab === 'PROFILE' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white mb-4">Profile Details</h3>
                        <div className="flex items-center gap-4 mb-6">
                             <div className="w-16 h-16 rounded-full bg-stone-800 overflow-hidden border-2 border-amber-500">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="User" className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-stone-400 text-xs uppercase font-bold tracking-wider mb-1">Welcome back,</p>
                                <p className="text-xl font-bold text-white">{userName}</p>
                             </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Display Name</label>
                            <input 
                                type="text" 
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#1E1E1E] border border-stone-700 rounded-xl focus:outline-none focus:border-amber-500 text-white placeholder-stone-600"
                            />
                        </div>
                        
                        <div className="pt-6 mt-6 border-t border-stone-800">
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-stone-400 text-xs flex gap-3 leading-relaxed">
                                <AlertTriangle size={16} className="flex-shrink-0 text-amber-500" />
                                <p>Your data is stored locally on this device. Clearing your browser cache or cookies will remove all transaction history permanently. Consider exporting your data from the Log tab regularly.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ACCOUNTS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-bold text-white">Manage Accounts</h3>
                             <span className="text-xs text-stone-500 bg-stone-800 px-2 py-1 rounded-md">{accounts.length} Accounts</span>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex items-center justify-between p-4 bg-[#1E1E1E] border border-stone-800 rounded-xl group hover:border-stone-600 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-stone-700 overflow-hidden border border-stone-600 flex items-center justify-center text-stone-500">
                                            {acc.type === 'PERSONAL' ? <User size={18}/> : <Wallet size={18}/>}
                                        </div>
                                        <div>
                                            {editingId === acc.id ? (
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onBlur={saveEdit}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                    className="bg-black border border-amber-500 rounded px-2 py-1 text-white text-sm outline-none w-32"
                                                />
                                            ) : (
                                                <p className="font-bold text-white">{acc.name}</p>
                                            )}
                                            <p className="text-[10px] text-stone-500 uppercase">{acc.type}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {editingId === acc.id ? (
                                            <button onClick={saveEdit} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"><Check size={16} /></button>
                                        ) : (
                                            <button onClick={() => startEdit(acc)} className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-lg text-xs font-medium">Edit</button>
                                        )}
                                        
                                        {accounts.length > 1 && (
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm(`Delete account "${acc.name}" and all its transactions? This action cannot be undone.`)) {
                                                        onDeleteAccount(acc.id);
                                                    }
                                                }}
                                                className="p-2 text-stone-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Delete Account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add New */}
                        <form onSubmit={handleAddAccount} className="pt-6 mt-6 border-t border-stone-800">
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Add New Account</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    placeholder="e.g. Father's Wallet"
                                    className="flex-1 px-4 py-3 bg-[#1E1E1E] border border-stone-700 rounded-xl focus:outline-none focus:border-amber-500 text-white placeholder-stone-600 text-sm"
                                />
                                <button type="submit" disabled={!newAccountName} className="px-4 py-3 bg-stone-800 hover:bg-amber-500 hover:text-black disabled:opacity-50 disabled:hover:bg-stone-800 disabled:hover:text-stone-400 text-stone-300 rounded-xl font-bold transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;