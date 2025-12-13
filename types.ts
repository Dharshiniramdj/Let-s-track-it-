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

export interface Account {
    id: string;
    name: string;
    type: 'PERSONAL' | 'FAMILY' | 'BUSINESS';
    color: string;
    avatarSeed: string;
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
}

export interface AISettings {
    persona: 'PROFESSIONAL' | 'FRIENDLY' | 'STRICT' | 'FUNNY';
    monthlyBudgetAlert: boolean;
    autoCategorize: boolean;
}

export interface AppData {
    version: number;
    profile: UserProfile;
    accounts: Account[];
    transactions: Transaction[];
    aiSettings: AISettings;
}