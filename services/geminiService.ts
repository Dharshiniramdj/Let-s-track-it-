import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, TransactionType, PaymentMode, Category, Suggestion } from "../types";

// Safe, lazy initialization of Gemini client
const getApiKey = (): string => {
  return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
};

let cachedAi: GoogleGenAI | null = null;

export const getAiClient = (): GoogleGenAI | null => {
  const key = getApiKey();
  if (!key) return null;
  if (!cachedAi) {
    try {
      cachedAi = new GoogleGenAI({ apiKey: key });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
      return null;
    }
  }
  return cachedAi;
};

const transactionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER, description: "The amount of money involved." },
    type: { type: Type.STRING, enum: Object.values(TransactionType), description: "Whether it is INCOME or EXPENSE." },
    mode: { type: Type.STRING, enum: Object.values(PaymentMode), description: "Method of payment. Default to UPI if it looks like a digital receipt." },
    platform: { type: Type.STRING, description: "Where the transaction happened (e.g., GPay, Amazon, Offline)." },
    purpose: { type: Type.STRING, description: "Short description of the transaction." },
    category: { type: Type.STRING, enum: Object.values(Category), description: "Category of the transaction." },
    date: { type: Type.STRING, description: "Date of transaction in ISO 8601 format (YYYY-MM-DD)." },
    isShopping: { type: Type.BOOLEAN, description: "True if this is an online shopping order for a product." },
    shoppingDetails: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        appName: { type: Type.STRING },
        productName: { type: Type.STRING },
        forWhom: { type: Type.STRING },
        orderedDate: { type: Type.STRING },
        deliveryDate: { type: Type.STRING },
        status: { type: Type.STRING, enum: ['ORDERED', 'DELIVERED'] }
      }
    }
  },
  required: ["amount", "type", "purpose", "category"]
};

// Handle text input
export const parseNaturalLanguageTransaction = async (input: string): Promise<Partial<Transaction> | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Parse the following natural language finance entry into a structured JSON object. 
      Today's date is ${new Date().toISOString().split('T')[0]}.
      Input: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
        systemInstruction: "You are a helpful financial assistant. Infer missing details where possible (e.g., 'lunch' implies 'FOOD' category, 'laptop' implies 'ELECTRONICS' or 'SHOPPING'). Default to 'EXPENSE' if not specified. If it looks like online shopping, set isShopping to true and fill details."
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing transaction with Gemini:", error);
    return null;
  }
};

// Handle Image Input (Snap & Track)
export const parseImageTransaction = async (base64Image: string, mimeType: string = 'image/png'): Promise<Partial<Transaction> | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          },
          {
            text: `Analyze this image (receipt, screenshot of payment, or bill) and extract transaction details into JSON. 
            Today's date is ${new Date().toISOString().split('T')[0]}.
            If the image contains a UPI payment screenshot, extract the 'Paid to' name as purpose/platform.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing image with Gemini:", error);
    return null;
  }
};

// --- Multi-Turn Chatbot Support ---

export type GeminiModelName = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

export interface ChatHistoryTurn {
  role: 'user' | 'model';
  content: string;
}

export const ROLE_SYSTEM_INSTRUCTIONS: Record<string, { name: string; tagline: string; defaultModel: GeminiModelName; prompt: string }> = {
  COACH: {
    name: 'Wealth Coach',
    tagline: 'Balanced financial guidance & habit building',
    defaultModel: 'gemini-3.5-flash',
    prompt: `You are the Wealth Coach for "Let's Track It", an empathetic, insightful, and practical personal finance advisor.
Your objective is to help the user master their money, optimize monthly category budgets (like Groceries, Electronics, Dining), and develop disciplined savings habits without feeling deprived.
Always ground your responses in their actual financial numbers and monthly goals provided in the context.
Keep your answers engaging, well-structured, actionable, and warm. Use bold highlights and concise bullet points.`
  },
  AUDITOR: {
    name: 'Rapid Auditor',
    tagline: 'Fast checks, spending leaks & burn rate alerts',
    defaultModel: 'gemini-3.1-flash-lite',
    prompt: `You are the Rapid Budget Auditor for "Let's Track It".
Your priority is speed, precision, and finding waste. Analyze transactions rapidly, identify unnecessary recurring micro-transactions, flag impulse delivery spends (Zepto, Blinkit, Swiggy), and check if any category has exceeded its target.
Provide direct, compact, no-fluff answers with crisp bullet points and immediate corrective steps.`
  },
  PLANNER: {
    name: 'Strategic Planner',
    tagline: 'Deep category modeling, long-term targets & debt payoff',
    defaultModel: 'gemini-3.1-pro-preview',
    prompt: `You are the Deep Strategic Financial Planner for "Let's Track It".
You specialize in advanced financial architecture: category target optimization (Groceries, Electronics, Shopping), capital allocation, debt management, and forecasting savings rates over 3 to 12 months.
Provide thorough, reasoned, and mathematically sound calculations. Break down category percentages, opportunity costs, and projected savings.`
  },
  FRUGAL: {
    name: 'Shopping & Impulse Guard',
    tagline: 'Curbs quick-commerce & e-commerce shopping spikes',
    defaultModel: 'gemini-3.5-flash',
    prompt: `You are the Shopping & Impulse Guard for "Let's Track It".
You specialize in helping users conquer modern digital shopping traps: online retail (Amazon, Flipkart), quick-commerce (Blinkit, Zepto, Instamart), and uncoordinated family spending on shared cards.
Review pending deliveries, check electronics/shopping category goals, challenge impulse buys with the 48-hour rule, and suggest high-yield alternatives.`
  }
};

/**
 * Builds real-time Markdown context about the user's accounts, transactions, and category savings goals
 */
export const buildFinancialContext = (
  accountName: string,
  transactions: Transaction[],
  goals: Array<{ category: string; targetAmount: number; month: string }> = []
): string => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTx = transactions.filter(t => t.date.startsWith(currentMonth));

  const income = currentMonthTx
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((s, t) => s + t.amount, 0);

  const expense = currentMonthTx
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((s, t) => s + t.amount, 0);

  const balance = income - expense;

  // Category breakdown for current month
  const categoryExpenses: Record<string, number> = {};
  currentMonthTx.forEach(t => {
    if (t.type === TransactionType.EXPENSE) {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    }
  });

  // Goals breakdown
  const goalsSummary = goals.map(g => {
    const spent = categoryExpenses[g.category] || 0;
    const remaining = g.targetAmount - spent;
    const pct = Math.round((spent / g.targetAmount) * 100);
    return `- ${g.category}: Target ₹${g.targetAmount.toLocaleString()} | Spent ₹${spent.toLocaleString()} (${pct}%) | ${remaining >= 0 ? `₹${remaining.toLocaleString()} left` : `Exceeded by ₹${Math.abs(remaining).toLocaleString()}`}`;
  }).join('\n');

  // Pending deliveries
  const pendingOrders = transactions
    .filter(t => t.shoppingDetails && t.shoppingDetails.status === 'ORDERED')
    .map(t => `- ${t.shoppingDetails?.productName || t.purpose} (₹${t.amount}) via ${t.shoppingDetails?.appName || t.platform}, est delivery: ${t.shoppingDetails?.deliveryDate || 'Pending'}`);

  return `
[LIVE USER FINANCIAL CONTEXT]
- Active Account: ${accountName}
- Current Month: ${currentMonth}
- Month Income: ₹${income.toLocaleString()}
- Month Expenses: ₹${expense.toLocaleString()}
- Net Balance / Savings this month: ₹${balance.toLocaleString()}

Active Category Goals Progress:
${goalsSummary || 'No specific category goals configured yet.'}

Spending Breakdown this Month:
${Object.entries(categoryExpenses).map(([c, amt]) => `- ${c}: ₹${amt.toLocaleString()}`).join('\n') || 'No expenses logged this month yet.'}

Pending Online Orders in Transit:
${pendingOrders.length > 0 ? pendingOrders.join('\n') : 'No pending orders.'}
[/LIVE USER FINANCIAL CONTEXT]
`;
};

/**
 * Sends a multi-turn conversation to the Gemini API
 */
export const sendChatMessage = async (
  history: ChatHistoryTurn[],
  roleId: string,
  modelName: GeminiModelName = 'gemini-3.5-flash',
  financialContext: string = ''
): Promise<{ text: string; error?: string }> => {
  const ai = getAiClient();
  if (!ai) {
    return {
      text: "Gemini API key is not configured in this environment. Please ensure an API key is available in your environment settings.",
      error: "MISSING_API_KEY"
    };
  }

  const roleConfig = ROLE_SYSTEM_INSTRUCTIONS[roleId] || ROLE_SYSTEM_INSTRUCTIONS.COACH;
  const fullSystemInstruction = `${roleConfig.prompt}\n\n${financialContext}\n\nKeep all advice specific, constructive, and oriented towards helping the user reach their savings goals.`;

  try {
    // Format history for @google/genai
    const formattedContents = history.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.content }]
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      return { text: "No response text generated by the model." };
    }

    return { text: responseText };
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    return {
      text: `Unable to complete chat request: ${error?.message || 'Unknown error occurred'}. You may try switching to a different model or rephrasing your message.`,
      error: error?.message
    };
  }
};