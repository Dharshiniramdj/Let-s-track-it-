export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum PaymentMode {
  UPI = 'UPI',
  CASH = 'CASH',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  OTHER = 'OTHER'
}

export enum Category {
  FOOD = 'FOOD',
  GROCERY = 'GROCERY',
  SHOPPING = 'SHOPPING',
  ELECTRONICS = 'ELECTRONICS',
  TRAVEL = 'TRAVEL',
  BILLS = 'BILLS',
  ENTERTAINMENT = 'ENTERTAINMENT',
  HEALTH = 'HEALTH',
  INCOME = 'INCOME',
  OTHERS = 'OTHERS'
}

export interface ShoppingDetails {
  appName: string;
  productName: string;
  forWhom: string;
  orderedDate: string; // ISO Date string
  deliveryDate: string; // ISO Date string
  status: 'ORDERED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
}

export interface Transaction {
  id: string;
  accountId: string; // Linked Account
  date: string; // ISO Date string
  amount: number;
  type: TransactionType;
  mode: PaymentMode;
  platform: string; // e.g., "GPay", "PhonePe", "Offline", "Amazon"
  purpose: string;
  category: Category;
  shoppingDetails?: ShoppingDetails;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  accountId: string;
  category: string; // e.g., 'Groceries', 'Electronics', 'Food', etc.
  targetAmount: number; // Monthly spending limit or target savings budget
  month: string; // YYYY-MM
  notes?: string;
  createdAt: number;
}

export interface Account {
    id: string;
    name: string;
    type: 'PERSONAL' | 'FAMILY' | 'BUSINESS';
    color: string;
    avatarSeed: string;
    budgets?: Record<string, number>; // Category name -> Amount limit
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  shoppingCount: number;
}

export interface UserProfile {
    name: string;
    email: string;
    phone: string;
    isVerified: boolean;
    avatarSeed?: string;
}

export interface AISettings {
    persona: 'PROFESSIONAL' | 'FRIENDLY' | 'STRICT' | 'FUNNY';
    monthlyBudgetAlert: boolean;
    autoCategorize: boolean;
}

export interface Suggestion {
  id: string;
  title: string;
  message: string;
  type: 'SAVING' | 'ALERT' | 'HABIT' | 'KUDOS';
  action: string; // Short action text like "Review Subscriptions"
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export type ChatRolePreset = 'COACH' | 'AUDITOR' | 'PLANNER' | 'FRUGAL';

export interface ChatBotRoleConfig {
  id: ChatRolePreset;
  name: string;
  tagline: string;
  systemInstruction: string;
  defaultModel: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
  badge: string;
}

export interface AppData {
    version: number;
    profile: UserProfile;
    accounts: Account[];
    transactions: Transaction[];
    goals?: SavingsGoal[];
    aiSettings: AISettings;
}