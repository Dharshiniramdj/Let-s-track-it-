import React, { useState, useRef } from 'react';
import { Account, UserProfile, AISettings } from '../types';
import { X, User, CreditCard, Trash2, Plus, AlertTriangle, Check, Wallet, Smartphone, Mail, Download, Upload, Bot, Sparkles, SmartphoneCharging, Moon, Sun, Monitor } from 'lucide-react';

interface Props {
  accounts: Account[];
  userProfile: UserProfile;
  aiSettings: AISettings;
  theme: 'DARK' | 'LIGHT';
  setTheme: (t: 'DARK' | 'LIGHT') => void;
  onClose: () => void;
  onUpdateAccounts: (accounts: Account[]) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateAiSettings: (settings: AISettings) => void;
  onDeleteAccount: (id: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Zoe', 'Jack', 'Trouble', 'Coco', 'Max', 'Luna', 'Buster', 'Bella'];

const SettingsModal: React.FC<Props> = ({ 
    accounts, 
    userProfile, 
    aiSettings,
    theme,
    setTheme,
    onClose, 
    onUpdateAccounts, 
    onUpdateProfile,
    onUpdateAiSettings,
    onDeleteAccount,
    onExportData,
    onImportData
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ACCOUNTS' | 'AI' | 'DATA' | 'APPEARANCE'>('ACCOUNTS');
  const [newAccountName, setNewAccountName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [tempName, setTempName] = useState(userProfile.name);
  const [tempEmail, setTempEmail] = useState(userProfile.email);
  const [tempPhone, setTempPhone] = useState(userProfile.phone);
  const [tempAvatarSeed, setTempAvatarSeed] = useState(userProfile.avatarSeed || userProfile.name);

  const handleSaveProfile = () => {
    onUpdateProfile({
        ...userProfile,
        name: tempName,
        email: tempEmail,
        phone: tempPhone,
        avatarSeed: tempAvatarSeed,
        isVerified: !!(tempEmail || tempPhone)
    });
    alert("Profile saved!");
  };

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

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files?.[0]) {
          if(window.confirm("Importing data will overwrite your current data. Continue?")) {
              onImportData(e.target.files[0]);
          }
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-3xl border border-[var(--border-color)] flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
            <h2 className="text-2xl font-bold text-[var(--text-main)]">Settings</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-1/3 border-r border-[var(--border-color)] p-3 md:p-4 space-y-2 bg-[var(--bg-main)]">
                <button 
                    onClick={() => setActiveTab('ACCOUNTS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm md:text-base ${activeTab === 'ACCOUNTS' ? 'bg-amber-500 text-black font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]'}`}
                >
                    <CreditCard size={18} className="flex-shrink-0"/> <span className="truncate">Accounts</span>
                </button>
                <button 
                    onClick={() => setActiveTab('PROFILE')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm md:text-base ${activeTab === 'PROFILE' ? 'bg-amber-500 text-black font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]'}`}
                >
                    <User size={18} className="flex-shrink-0"/> <span className="truncate">Profile</span>
                </button>
                <button 
                    onClick={() => setActiveTab('AI')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm md:text-base ${activeTab === 'AI' ? 'bg-amber-500 text-black font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]'}`}
                >
                    <Sparkles size={18} className="flex-shrink-0"/> <span className="truncate">Smart AI</span>
                </button>
                <button 
                    onClick={() => setActiveTab('APPEARANCE')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm md:text-base ${activeTab === 'APPEARANCE' ? 'bg-amber-500 text-black font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]'}`}
                >
                    <Monitor size={18} className="flex-shrink-0"/> <span className="truncate">Appearance</span>
                </button>
                <button 
                    onClick={() => setActiveTab('DATA')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm md:text-base ${activeTab === 'DATA' ? 'bg-amber-500 text-black font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]'}`}
                >
                    <SmartphoneCharging size={18} className="flex-shrink-0"/> <span className="truncate">Sync & Data</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[var(--bg-input)]">
                
                {activeTab === 'PROFILE' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                             <div className="w-16 h-16 rounded-full bg-stone-800 overflow-hidden border-2 border-amber-500">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tempAvatarSeed}`} alt="User" className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-[var(--text-muted)] text-xs uppercase font-bold tracking-wider mb-1">Editing Profile</p>
                                <p className="text-xl font-bold text-[var(--text-main)]">{userProfile.name}</p>
                             </div>
                        </div>

                        {/* Avatar Picker */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Choose Avatar</label>
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {AVATAR_SEEDS.map((seed) => (
                                    <button 
                                        key={seed}
                                        onClick={() => setTempAvatarSeed(seed)}
                                        className={`flex-shrink-0 w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${tempAvatarSeed === seed ? 'border-amber-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Display Name</label>
                                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-[var(--text-muted)]" size={18} />
                                    <input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} placeholder="Link your email"
                                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Phone Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-3.5 text-[var(--text-muted)]" size={18} />
                                    <input type="tel" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} placeholder="Link your phone"
                                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)]" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button onClick={handleSaveProfile} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'ACCOUNTS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-bold text-[var(--text-main)]">Manage Accounts</h3>
                             <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded-md">{accounts.length} Active</span>
                        </div>

                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl group hover:border-stone-500 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                                            {acc.type === 'PERSONAL' ? <User size={18}/> : <Wallet size={18}/>}
                                        </div>
                                        <div>
                                            {editingId === acc.id ? (
                                                <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                    className="bg-[var(--bg-input)] border border-amber-500 rounded px-2 py-1 text-[var(--text-main)] text-sm outline-none w-32" />
                                            ) : (
                                                <p className="font-bold text-[var(--text-main)]">{acc.name}</p>
                                            )}
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase">{acc.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {editingId === acc.id ? (
                                            <button onClick={saveEdit} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"><Check size={16} /></button>
                                        ) : (
                                            <button onClick={() => startEdit(acc)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)] rounded-lg text-xs font-medium">Edit</button>
                                        )}
                                        {accounts.length > 1 && (
                                            <button onClick={() => { if(window.confirm(`Delete account "${acc.name}"?`)) onDeleteAccount(acc.id); }}
                                                className="p-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddAccount} className="pt-6 mt-6 border-t border-[var(--border-color)]">
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Add New Account</label>
                            <div className="flex gap-2">
                                <input type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="e.g. Father's Wallet"
                                    className="flex-1 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm" />
                                <button type="submit" disabled={!newAccountName} className="px-4 py-3 bg-[var(--bg-secondary)] hover:bg-amber-500 hover:text-black disabled:opacity-50 disabled:hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-xl font-bold transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'AI' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-amber-500 p-2 rounded-lg text-black"><Bot size={24} /></div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">AI Assistant Preferences</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Financial Persona</label>
                                <p className="text-xs text-[var(--text-muted)] mb-3">Choose how the AI talks to you about your money.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {['PROFESSIONAL', 'FRIENDLY', 'STRICT', 'FUNNY'].map((persona) => (
                                        <button 
                                            key={persona}
                                            onClick={() => onUpdateAiSettings({...aiSettings, persona: persona as any})}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${aiSettings.persona === persona ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-stone-500'}`}
                                        >
                                            {persona}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-[var(--text-main)]">Monthly Budget Alerts</p>
                                        <p className="text-xs text-[var(--text-muted)]">Get warned if spending looks high.</p>
                                    </div>
                                    <div 
                                        onClick={() => onUpdateAiSettings({...aiSettings, monthlyBudgetAlert: !aiSettings.monthlyBudgetAlert})}
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${aiSettings.monthlyBudgetAlert ? 'bg-amber-500' : 'bg-[var(--bg-secondary)]'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${aiSettings.monthlyBudgetAlert ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-[var(--text-main)]">Auto-Categorize Receipts</p>
                                        <p className="text-xs text-[var(--text-muted)]">Use AI to guess categories.</p>
                                    </div>
                                    <div 
                                        onClick={() => onUpdateAiSettings({...aiSettings, autoCategorize: !aiSettings.autoCategorize})}
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${aiSettings.autoCategorize ? 'bg-amber-500' : 'bg-[var(--bg-secondary)]'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${aiSettings.autoCategorize ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'APPEARANCE' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-amber-500 p-2 rounded-lg text-black"><Monitor size={24} /></div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">App Appearance</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Theme Preference</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setTheme('DARK')}
                                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all ${theme === 'DARK' ? 'border-amber-500 bg-[var(--bg-secondary)] text-amber-500' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'}`}
                                    >
                                        <Moon size={32} />
                                        <span className="font-bold">Dark Mode</span>
                                    </button>
                                    <button 
                                        onClick={() => setTheme('LIGHT')}
                                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all ${theme === 'LIGHT' ? 'border-amber-500 bg-[var(--bg-secondary)] text-amber-500' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'}`}
                                    >
                                        <Sun size={32} />
                                        <span className="font-bold">Light Mode</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'DATA' && (
                    <div className="space-y-6">
                         <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6">
                            <h4 className="font-bold text-emerald-500 mb-1 flex items-center gap-2"><Check size={16}/> Sync Status</h4>
                            <p className="text-xs text-[var(--text-muted)]">
                                {userProfile.isVerified ? `Linked to ${userProfile.email || userProfile.phone}` : "Your data is currently only on this device."}
                            </p>
                         </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Cross-Device Sync</h3>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                To move your data to another device (e.g. Phone to Laptop), use the Backup feature to download a file, then Restore it on the other device.
                            </p>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={onExportData} className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-secondary)] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[var(--bg-secondary)] p-2 rounded-lg text-[var(--text-main)] group-hover:bg-amber-500 group-hover:text-black transition-colors"><Download size={20} /></div>
                                        <div className="text-left">
                                            <p className="font-bold text-[var(--text-main)]">Backup Data</p>
                                            <p className="text-xs text-[var(--text-muted)]">Download .json file</p>
                                        </div>
                                    </div>
                                </button>

                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-secondary)] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[var(--bg-secondary)] p-2 rounded-lg text-[var(--text-main)] group-hover:bg-amber-500 group-hover:text-black transition-colors"><Upload size={20} /></div>
                                        <div className="text-left">
                                            <p className="font-bold text-[var(--text-main)]">Restore Data</p>
                                            <p className="text-xs text-[var(--text-muted)]">Upload .json file</p>
                                        </div>
                                    </div>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportClick} />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-[var(--border-color)]">
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[var(--text-muted)] text-xs flex gap-3 leading-relaxed">
                                <AlertTriangle size={16} className="flex-shrink-0 text-amber-500" />
                                <p>Always keep a backup of your data. Clearing browser cache will wipe local storage.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;