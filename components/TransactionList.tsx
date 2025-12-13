import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowDownRight, ArrowUpRight, Search, Trash2, Tag, Filter, FileSpreadsheet, FileText, Image as ImageIcon, Pencil, Calendar, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit }) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredData = transactions.filter(t => {
    const matchesSearch = t.purpose.toLowerCase().includes(filter.toLowerCase()) || 
                          t.category.toLowerCase().includes(filter.toLowerCase()) ||
                          t.platform.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    
    let matchesDate = true;
    if (startDate) {
        matchesDate = matchesDate && new Date(t.date) >= new Date(startDate);
    }
    if (endDate) {
        matchesDate = matchesDate && new Date(t.date) <= new Date(endDate);
    }

    return matchesSearch && matchesType && matchesDate;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredData.map(t => ({
      Date: t.date,
      Type: t.type,
      Amount: t.amount,
      Mode: t.mode,
      Category: t.category,
      Platform: t.platform,
      Purpose: t.purpose,
      'Is Order': t.shoppingDetails ? 'Yes' : 'No',
      'Product': t.shoppingDetails?.productName || '',
      'Status': t.shoppingDetails?.status || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "LetsTrackIt_Log.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Transaction Log - Lets Track It", 14, 20);
    
    const tableData = filteredData.map(t => [
      t.date,
      t.purpose,
      t.category,
      t.mode,
      `${t.type === TransactionType.INCOME ? '+' : '-'} ${t.amount}`,
      t.shoppingDetails ? 'Order' : '-'
    ]);

    autoTable(doc, {
      head: [['Date', 'Purpose', 'Category', 'Mode', 'Amount', 'Type']],
      body: tableData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] } // Amber color
    });

    doc.save("LetsTrackIt_Report.pdf");
  };

  // Export as Image
  const exportToImage = async () => {
    if (tableRef.current) {
      const canvas = await html2canvas(tableRef.current, { backgroundColor: '#1E1E1E' });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "LetsTrackIt_Snapshot.png";
      link.click();
    }
  };

  const clearDateFilter = () => {
      setStartDate('');
      setEndDate('');
  };

  return (
    <div className="space-y-4">
        {/* Date Slicer & Type Filter Row */}
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
                 {/* Type Filter */}
                <div className="relative">
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="appearance-none bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                    >
                        <option value="ALL">All Types</option>
                        <option value="EXPENSE">Expenses</option>
                        <option value="INCOME">Income</option>
                    </select>
                    <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                </div>
                
                {/* Date Slicer */}
                <div className="flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] font-bold uppercase">From</span>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-[var(--text-main)] text-sm focus:outline-none" 
                        />
                    </div>
                    <div className="w-px h-6 bg-[var(--border-color)]"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] font-bold uppercase">To</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-[var(--text-main)] text-sm focus:outline-none" 
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button onClick={clearDateFilter} className="ml-2 p-1 bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-rose-500">
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={exportToExcel} title="Export to Excel" className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-muted)] rounded-xl hover:text-emerald-500 hover:border-emerald-500 transition-colors">
                <FileSpreadsheet size={18} />
                </button>
                <button onClick={exportToPDF} title="Export to PDF" className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-muted)] rounded-xl hover:text-rose-500 hover:border-rose-500 transition-colors">
                <FileText size={18} />
                </button>
                <button onClick={exportToImage} title="Save as Image" className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-muted)] rounded-xl hover:text-sky-500 hover:border-sky-500 transition-colors">
                <ImageIcon size={18} />
                </button>
            </div>
        </div>

        <div className="dashboard-card overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]" ref={tableRef}>
            <div className="p-6 border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-3 self-start md:self-center">
                    <div className="p-2 bg-[var(--bg-secondary)] rounded-lg text-amber-500"><Tag size={20} /></div>
                    {typeFilter === 'EXPENSE' ? 'Spending List' : (typeFilter === 'INCOME' ? 'Income Log' : 'Transactions')}
                </h3>
                
                <div className="relative w-full md:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input 
                    type="text" 
                    placeholder="Search transaction..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-amber-500 transition-colors"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="bg-[var(--bg-secondary)] text-[var(--text-muted)] uppercase font-bold text-xs tracking-wider">
                    <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Date</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center rounded-tr-xl">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                    {filteredData.map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-muted)] font-mono text-xs align-top pt-5">{t.date}</td>
                        <td className="px-6 py-4 font-medium text-[var(--text-main)] align-top">
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {t.type === TransactionType.INCOME ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{t.purpose}</p>
                                {t.shoppingDetails && (
                                    <div className="mt-2 bg-[var(--bg-input)] p-2 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                                        <div className="text-amber-500 font-bold mb-1 flex items-center gap-1"><Tag size={10}/> Order Details</div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <span>Product: <span className="text-[var(--text-main)]">{t.shoppingDetails.productName}</span></span>
                                            <span>Store: <span className="text-[var(--text-main)]">{t.shoppingDetails.appName}</span></span>
                                            <span>Status: <span className="text-[var(--text-main)]">{t.shoppingDetails.status}</span></span>
                                            <span>Est: <span className="text-[var(--text-main)]">{t.shoppingDetails.deliveryDate}</span></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-muted)] align-top pt-5">
                            <div className="flex flex-col gap-1">
                                <span className="bg-[var(--bg-input)] border border-[var(--border-color)] px-2 py-1 rounded text-xs text-[var(--text-main)] w-fit">
                                    {t.platform}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] ml-1 uppercase tracking-wide">{t.mode}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 align-top pt-5">
                        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-[var(--bg-secondary)] text-[var(--text-muted)] tracking-wide border border-[var(--border-color)]">
                            {t.category}
                        </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold text-base align-top pt-5 ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-[var(--text-main)]'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}₹{t.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center align-top pt-4">
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => onEdit(t)} className="p-2 rounded-lg hover:bg-amber-500/20 text-[var(--text-muted)] hover:text-amber-500 transition-colors" title="Edit">
                            <Pencil size={16} />
                            </button>
                            <button onClick={() => onDelete(t.id)} className="p-2 rounded-lg hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 transition-colors" title="Delete">
                            <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                    {filteredData.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-[var(--text-muted)] flex flex-col items-center justify-center">
                        <Filter size={32} className="mb-2 opacity-20" />
                        No transactions match your search.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default TransactionList;