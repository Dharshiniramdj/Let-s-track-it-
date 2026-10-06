import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Transaction, SavingsGoal, Account, ChatMessage, ChatRolePreset } from '../types';
import { 
  sendChatMessage, 
  buildFinancialContext, 
  ROLE_SYSTEM_INSTRUCTIONS, 
  GeminiModelName 
} from '../services/geminiService';
import { 
  Bot, User, Send, Sparkles, Trash2, Download, Zap, BrainCircuit, ShieldAlert, 
  PiggyBank, RefreshCw, Copy, Check, ChevronDown, Info, ShoppingBag 
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  goals: SavingsGoal[];
  account?: Account;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

const ROLE_OPTIONS: Array<{
  id: ChatRolePreset;
  name: string;
  shortName: string;
  tagline: string;
  icon: any;
  defaultModel: GeminiModelName;
  badge: string;
}> = [
  {
    id: 'COACH',
    name: 'Wealth Coach',
    shortName: 'Coach',
    tagline: 'Balanced financial guidance & habit building',
    icon: Sparkles,
    defaultModel: 'gemini-3.5-flash',
    badge: 'General Guidance'
  },
  {
    id: 'AUDITOR',
    name: 'Rapid Auditor',
    shortName: 'Auditor',
    tagline: 'Fast leak detection, impulse checks & daily burn rate',
    icon: Zap,
    defaultModel: 'gemini-3.1-flash-lite',
    badge: 'High Speed'
  },
  {
    id: 'PLANNER',
    name: 'Strategic Planner',
    shortName: 'Planner',
    tagline: 'Deep category modeling, long-term projections & debt payoff',
    icon: BrainCircuit,
    defaultModel: 'gemini-3.1-pro-preview',
    badge: 'Deep Reasoning'
  },
  {
    id: 'FRUGAL',
    name: 'Shopping Guard',
    shortName: 'Shopping Guard',
    tagline: 'Anti-impulse buy coach for Amazon, Blinkit, Zepto',
    icon: ShoppingBag,
    defaultModel: 'gemini-3.5-flash',
    badge: 'Impulse Defense'
  }
];

const SUGGESTED_PROMPTS = [
  'How am I pacing against my Groceries and Electronics goals?',
  'Audit my quick-commerce and food delivery spending this month',
  'Give me 3 realistic cuts to save ₹5,000 extra this month',
  'Am I spending too much on impulse online shopping?'
];

const GeminiChatbot: React.FC<Props> = ({
  transactions,
  goals,
  account,
  initialPrompt,
  onClearInitialPrompt
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatRolePreset>('COACH');
  const [selectedModel, setSelectedModel] = useState<GeminiModelName>('gemini-3.5-flash');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Storage key based on account or default
  const storageKey = `lets_track_it_chat_${account?.id || 'default'}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        content: `👋 Hello! I'm your **AI Financial Advisor** powered by Gemini.\n\nI have real-time visibility into your account balance, **monthly savings goals** (like Groceries and Electronics), and your active transactions. How can I help you optimize your money today?`,
        timestamp: Date.now(),
        modelUsed: 'gemini-3.5-flash'
      }
    ];
  });

  // Save messages to storage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages, storageKey]);

  // Handle incoming initial prompt (e.g. from Dashboard "Ask AI about this goal")
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // When changing role, update default model automatically
  const handleSelectRole = (roleId: ChatRolePreset) => {
    setSelectedRole(roleId);
    const roleOpt = ROLE_OPTIONS.find(r => r.id === roleId);
    if (roleOpt) {
      setSelectedModel(roleOpt.defaultModel);
    }
  };

  // Build live financial context
  const liveFinancialContext = useMemo(() => {
    return buildFinancialContext(
      account?.name || 'Personal Account',
      transactions,
      goals
    );
  }, [account, transactions, goals]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    const userMessageId = crypto.randomUUID();
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const nextMessages = [...messages, newUserMsg];
    setMessages(nextMessages);
    setInputMessage('');
    setIsSending(true);

    // Prepare history payload for SDK
    const historyPayload = nextMessages
      .filter(m => m.id !== 'welcome') // exclude initial banner if desired
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    try {
      const response = await sendChatMessage(
        historyPayload,
        selectedRole,
        selectedModel,
        liveFinancialContext
      );

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        modelUsed: selectedModel
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: `Error: ${error?.message || 'Could not communicate with Gemini.'}`,
        timestamp: Date.now(),
        modelUsed: selectedModel
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all conversation history with this advisor?')) {
      const freshWelcome: ChatMessage = {
        id: 'welcome',
        role: 'model',
        content: `Chat history cleared. I'm ready to help you analyze your finances and category goals with the **${ROLE_OPTIONS.find(r => r.id === selectedRole)?.name}** persona.`,
        timestamp: Date.now(),
        modelUsed: selectedModel
      };
      setMessages([freshWelcome]);
      localStorage.removeItem(storageKey);
    }
  };

  const handleExportChat = () => {
    const formatted = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role === 'user' ? 'You' : 'Gemini'}: \n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([formatted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LetsTrackIt_Chat_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render markdown-like formatting (bold, bullets, paragraphs)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-2" />;
          
          // Bullet point
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const cleanText = line.trim().replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-amber-500 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanText) }} />
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
              </div>
            );
          }

          // Header
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="font-bold text-base text-[var(--text-main)] mt-2">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="font-bold text-lg text-[var(--text-main)] mt-3 border-b border-[var(--border-color)] pb-1">{line.replace('## ', '')}</h3>;
          }

          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />;
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    // Escape HTML first
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--text-main)]">$1</strong>');
    // Inline code `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-[var(--bg-card)] px-1.5 py-0.5 rounded text-amber-500 font-mono text-xs">$1</code>');
    // Currency highlights
    escaped = escaped.replace(/(₹[\d,]+(\.\d+)?)/g, '<span class="font-mono font-bold text-amber-400">$1</span>');

    return escaped;
  };

  const activeRoleConfig = ROLE_OPTIONS.find(r => r.id === selectedRole) || ROLE_OPTIONS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-170px)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xl">
      {/* Top Bar: Persona & Model Selection */}
      <div className="p-4 md:px-6 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Role switcher buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
          {ROLE_OPTIONS.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`}
                title={role.tagline}
              >
                <Icon size={14} />
                <span>{role.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Model selector & Chat actions */}
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hidden sm:inline">
              Model:
            </span>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value as GeminiModelName)}
              className="bg-transparent text-xs font-bold text-[var(--text-main)] focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
            </select>
          </div>

          <button
            onClick={handleExportChat}
            title="Export conversation"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)] transition-colors"
          >
            <Download size={16} />
          </button>

          <button
            onClick={handleClearHistory}
            title="Clear conversation"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)] transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Role Subhead Info */}
      <div className="px-6 py-2 bg-[var(--bg-input)]/50 border-b border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-[var(--text-main)]">{activeRoleConfig.name}</span>
          <span className="hidden sm:inline">· {activeRoleConfig.tagline}</span>
        </div>
        <div className="text-[11px] font-mono text-amber-500/90 shrink-0">
          Grounded with {goals.length} Goals & {transactions.length} Records
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-amber-500'
                }`}
              >
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Content */}
              <div
                className={`p-4 rounded-2xl relative group transition-all ${
                  isUser
                    ? 'bg-amber-500 text-black rounded-tr-none font-medium'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-none'
                }`}
              >
                {/* Text Body */}
                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  renderFormattedContent(msg.content)
                )}

                {/* Footer metadata */}
                <div
                  className={`flex items-center justify-between gap-3 mt-2 text-[10px] ${
                    isUser ? 'text-black/70' : 'text-[var(--text-muted)]'
                  }`}
                >
                  <span className="font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {!isUser && (
                    <div className="flex items-center gap-2">
                      {msg.modelUsed && (
                        <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[9px]">
                          {msg.modelUsed}
                        </span>
                      )}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex gap-3 mr-auto max-w-lg animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-amber-500 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>{activeRoleConfig.name} is crunching your financial data with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 md:px-6 py-2 bg-[var(--bg-input)]/40 border-t border-[var(--border-color)] overflow-x-auto custom-scrollbar flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" /> Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={isSending}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 border border-[var(--border-color)] text-[var(--text-muted)] whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 md:p-6 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder={`Ask ${activeRoleConfig.name} about your goals, impulse spending, or budget adjustments... (Enter to send)`}
              className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 resize-none max-h-32 min-h-[48px]"
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="p-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black rounded-2xl font-bold shadow-md transition-all active:scale-95 shrink-0"
            title="Send Message"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
          Gemini models provide personalized coaching grounded in your local data. Use `gemini-3.1-pro-preview` for complex planning.
        </p>
      </div>
    </div>
  );
};

export default GeminiChatbot;
