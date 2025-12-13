import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, TransactionType, PaymentMode, Category, Suggestion } from "../types";

// Initialize Gemini
// NOTE: In a real production app, ensure API keys are handled securely.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

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
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Parse the following natural language finance entry into a structured JSON object. 
      Today's date is ${new Date().toISOString().split('T')[0]}.
      Input: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
        systemInstruction: "You are a helpful financial assistant. Infer missing details where possible (e.g., 'lunch' implies 'FOOD' category). Default to 'EXPENSE' if not specified. If it looks like online shopping, set isShopping to true and fill details."
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
  if (!apiKey) return null;

  try {
    // Remove data URL prefix if present for clean base64
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

export const generateMonthlyInsight = async (transactions: Transaction[], persona: string = 'PROFESSIONAL'): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate insights.";

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

  if (recentTransactions.length === 0) {
      return "No transactions found in the last 30 days to analyze. Add some spending to get smart insights!";
  }

  const simplifiedData = recentTransactions.map(t => ({
      d: t.date,
      t: t.type,
      a: t.amount,
      c: t.category,
      p: t.purpose,
  }));

  const dataString = JSON.stringify(simplifiedData);

  let systemInstruction = "You are a specialized financial analyst AI. Your goal is to provide a brief, actionable 'Monthly Spending Report' based on the provided transaction logs (d=date, t=type, a=amount, c=category, p=purpose).";
  
  if (persona === 'FRIENDLY') systemInstruction += " Tone: Warm, encouraging, using emojis. Like a supportive friend.";
  else if (persona === 'STRICT') systemInstruction += " Tone: Strict, no-nonsense, critical of non-essential spending. Focus on saving.";
  else if (persona === 'FUNNY') systemInstruction += " Tone: Humorous, sarcastic, witty. Make finance entertaining.";
  else systemInstruction += " Tone: Professional, concise, data-driven.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here is the JSON transaction data for the last 30 days:
      ${dataString}
      
      Please generate a report with these specific sections (use Markdown):
      1. 📊 **Spending Breakdown**: Quick summary of where money is going.
      2. 💡 **AI Budget Tips**: Specific, actionable advice to save money based on these specific purchases.
      3. 🏆 **Top Categories**: The highest expense areas.
      4. 🔮 **Outlook**: A brief financial health check.
      
      Keep the response under 350 words. Focus on insights, not just listing data.`,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 1000,
        temperature: 0.7
      }
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Could not generate insights at this time. Please check your internet connection or API key.";
  }
};

export const generateActionableSuggestions = async (transactions: Transaction[], persona: string): Promise<Suggestion[]> => {
    if (!apiKey) return [];

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 45); // Look at last 45 days for better patterns
    
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    // We limit to 50 items to keep prompt size efficient if there are many
    const simplifiedData = recentTransactions.slice(0, 50).map(t => ({
        d: t.date, t: t.type, a: t.amount, c: t.category, p: t.purpose,
    }));
    
    const suggestionSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                message: { type: Type.STRING, description: "A brief, 1-2 sentence advice." },
                type: { type: Type.STRING, enum: ['SAVING', 'ALERT', 'HABIT', 'KUDOS'] },
                action: { type: Type.STRING, description: "Short actionable label like 'Cut Dining' or 'Invest More'" },
                impact: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
            },
            required: ['title', 'message', 'type', 'action', 'impact']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze these transactions and provide 3 to 5 actionable financial suggestions to apply.
            Data: ${JSON.stringify(simplifiedData)}
            Persona: ${persona}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionSchema,
                systemInstruction: "You are a proactive financial coach. Look for overspending in categories, recurring subscriptions, high-frequency small purchases, or celebrate good saving habits. Return a list of specific, actionable suggestions.",
                temperature: 0.5
            }
        });

        const text = response.text;
        if(!text) return [];
        const suggestions: Omit<Suggestion, 'id'>[] = JSON.parse(text);
        
        return suggestions.map(s => ({ ...s, id: crypto.randomUUID() }));
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return [];
    }
}