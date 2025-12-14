import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMode, Category, ShoppingDetails } from '../types';
import { parseNaturalLanguageTransaction, parseImageTransaction } from '../services/geminiService';
import { Sparkles, Loader2, Plus, X, Camera, Upload, Receipt, ShoppingBag, Save, Wand2 } from 'lucide-react';

interface Props {
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'accountId'>) => void;
  onCancel: () => void;
  initialMode?: 'DEFAULT' | 'SHOPPING';
  initialData?: Transaction;
  history?: Transaction[];
}

const TransactionForm: React.FC<Props> = ({ onSave, onCancel, initialMode = 'DEFAULT', initialData, history = [] }) => {
  const [nlInput, setNlInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showShopping, setShowShopping] = useState(initialMode === 'SHOPPING');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [mode, setMode] = useState<PaymentMode>(PaymentMode.UPI);
  const [platform, setPlatform] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState<Category>(initialMode === 'SHOPPING' ? Category.SHOPPING : Category.OTHERS);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Shopping State
  const [appName, setAppName] = useState('');
  const [productName, setProductName] = useState('');
  const [forWhom, setForWhom] = useState('Self');
  const [orderedDate, setOrderedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState<'ORDERED' | 'DELIVERED'>('ORDERED');

  // Load Initial Data for Editing
  useEffect(() => {
    if (initialData) {
        setAmount(initialData.amount.toString());
        setType(initialData.type);
        setMode(initialData.mode);
        setPlatform(initialData.platform);
        setPurpose(initialData.purpose);
        setCategory(initialData.category);
        setDate(initialData.date);

        if (initialData.shoppingDetails || initialData.category === Category.SHOPPING) {
            setShowShopping(true);
            if (initialData.shoppingDetails) {
                setAppName(initialData.shoppingDetails.appName);
                setProductName(initialData.shoppingDetails.productName);
                setForWhom(initialData.shoppingDetails.forWhom);
                setOrderedDate(initialData.shoppingDetails.orderedDate);
                setDeliveryDate(initialData.shoppingDetails.deliveryDate);
                setStatus(initialData.shoppingDetails.status as any);
            }
        }
    } else if (initialMode === 'SHOPPING') {
        setShowShopping(true);
        setCategory(Category.SHOPPING);
    }
  }, [initialData, initialMode]);

  // Smart Category Auto-Suggest
  const handlePurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPurpose(val);
    setIsAutoFilled(false);

    // Only auto-fill if user hasn't edited the transaction type/category yet (simple heuristic: default is EXPENSE/OTHERS)
    // or we can just always suggest and let user override.
    if (!initialData && val.length > 2) {
        // Find most recent matching transaction
        const match = history.find(t => t.purpose.toLowerCase() === val.toLowerCase() || t.purpose.toLowerCase().includes(val.toLowerCase()));
        if (match) {
            setCategory(match.category);
            setType(match.type);
            setMode(match.mode);
            setPlatform(match.platform);
            setIsAutoFilled(true);
        }
    }
  };

  const populateForm = (result: any) => {
    if (result) {
      if (result.amount) setAmount(result.amount.toString());
      if (result.type) setType(result.type as TransactionType);
      if (result.mode) setMode(result.mode as PaymentMode);
      if (result.platform) setPlatform(result.platform);
      if (result.purpose) setPurpose(result.purpose);
      if (result.category) setCategory(result.category as Category);
      if (result.date) setDate(result.date);

      // @ts-ignore
      if (result.isShopping || result.category === Category.SHOPPING) {
        setShowShopping(true);
        if (result.shoppingDetails) {
          setAppName(result.shoppingDetails.appName || '');
          setProductName(result.shoppingDetails.productName || '');
          setForWhom(result.shoppingDetails.forWhom || 'Self');
          setOrderedDate(result.shoppingDetails.orderedDate || date);
          setDeliveryDate(result.shoppingDetails.deliveryDate || '');
        }
      }
    }
  };

  const handleAiParse = async () => {
    if (!nlInput.trim()) return;
    setIsLoadingAi(true);
    const result = await parseNaturalLanguageTransaction(nlInput);
    setIsLoadingAi(false);
    populateForm(result);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingAi(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const result = await parseImageTransaction(base64String, file.type);
      setIsLoadingAi(false);
      populateForm(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let shoppingDetails: ShoppingDetails | undefined = undefined;
    if (showShopping) {
      shoppingDetails = {
        appName,
        productName,
        forWhom,
        orderedDate,
        deliveryDate,
        status: status as any
      };
    }

    onSave({
      amount: parseFloat(amount),
      type,
      mode,
      platform,
      purpose,
      category,
      date,
      shoppingDetails
    });
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto border border-[var(--border-color)] relative text-[var(--text-main)] max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">
             {initialData ? 'Edit Transaction' : (initialMode === 'SHOPPING' ? 'Log Order' : 'Add Transaction')}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">{initialData ? 'Update details' : 'Manual entry or AI Scan'}</p>
        </div>
        <button onClick={onCancel} className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          <X size={20} />
        </button>
      </div>

      {!initialData && (
        /* AI Time Saving Section - Only show for new entries to keep edit clean */
        <div className="mb-8 bg-[var(--bg-secondary)] p-5 rounded-2xl border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-amber-500 flex items-center gap-2">
                <Sparkles size={16} />
                Smart Assistant
                </label>
            </div>
            
            <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                    placeholder="e.g., 'Uber ride 450 rupees'"
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] w-full"
                />
                <button
                    onClick={handleAiParse}
                    disabled={isLoadingAi || !nlInput}
                    className="bg-amber-500 text-black px-4 py-2 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors text-sm font-bold whitespace-nowrap"
                >
                    {isLoadingAi ? <Loader2 className="animate-spin" size={16} /> : 'Auto-Fill'}
                </button>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[var(--border-color)]"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] text-[var(--text-muted)] uppercase tracking-widest">or scan receipt</span>
                <div className="flex-grow border-t border-[var(--border-color)]"></div>
            </div>

            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingAi}
                className="w-full py-3 border border-dashed border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
                {isLoadingAi ? <Loader2 className="animate-spin" size={16} /> : <Camera size={18} />}
                Upload Screenshot / Bill
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
            />
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Amount</label>
            <div className="relative">
                <span className="absolute left-4 top-3.5 text-[var(--text-muted)] font-serif text-lg">₹</span>
                <input
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-xl font-bold text-[var(--text-main)] placeholder-[var(--text-muted)]"
                placeholder="0.00"
                />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Date</label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)]"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between">
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Purpose / Description</label>
            {isAutoFilled && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Wand2 size={10}/> Auto-suggested</span>}
          </div>
          <input
            required
            type="text"
            value={purpose}
            onChange={handlePurposeChange}
            placeholder="e.g. Swiggy, Uber, Rent"
            className={`w-full px-4 py-3 bg-[var(--bg-input)] border ${isAutoFilled ? 'border-amber-500/50' : 'border-[var(--border-color)]'} rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)] transition-colors`}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)] text-sm"
            >
              {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)] text-sm"
            >
              {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
           <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PaymentMode)}
              className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)] text-sm"
            >
              {Object.values(PaymentMode).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
           <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Platform</label>
             <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g. GPay"
              className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-amber-500 text-[var(--text-main)] text-sm"
            />
          </div>
        </div>

        {/* Shopping Toggle */}
        <div className="flex items-center gap-3 pt-2">
           <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="shopping-toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" checked={showShopping} onChange={(e) => setShowShopping(e.target.checked)} style={{right: showShopping ? '0' : 'auto', left: showShopping ? 'auto' : '0', borderColor: showShopping ? '#F59E0B' : '#44403c'}}/>
                <label htmlFor="shopping-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${showShopping ? 'bg-amber-500' : 'bg-stone-700'}`}></label>
            </div>
            <label htmlFor="shopping-toggle" className="text-sm font-medium text-[var(--text-muted)] select-none cursor-pointer flex items-center gap-2">
                <ShoppingBag size={16} /> Online Order Details
            </label>
        </div>

        {/* Extended Shopping Form */}
        {showShopping && (
          <div className="bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-color)] animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-amber-500 mb-4 border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                <Receipt size={14} /> Order Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase">App Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Amazon..."
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase">Product</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Item Name..."
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase">For Whom</label>
                <input
                  type="text"
                  value={forWhom}
                  onChange={(e) => setForWhom(e.target.value)}
                  placeholder="Self..."
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase">Delivery Est.</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)]"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--border-color)]">
          <button
            type="submit"
            className="w-full bg-amber-500 text-black py-4 rounded-xl hover:bg-amber-400 transition-colors font-bold flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {initialData ? <Save size={20} /> : <Plus size={20} />}
            {initialData ? 'Update Transaction' : 'Add to Ledger'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;