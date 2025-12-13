import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, TransactionType, PaymentMode, Category } from "../types";

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

export const generateMonthlyInsight = async (transactions: Transaction[]): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate insights.";

  const summary = transactions.map(t => 
    `${t.date}: ${t.type} of ${t.amount} via ${t.mode} for ${t.purpose} (${t.category})`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze these transactions and provide a "Smart Spending Report".
      
      The report should include:
      1. Spending Breakdown: Quick summary of where money is going.
      2. AI Budget Tips: Actionable advice to save money based on the data.
      3. Category Analysis: Highlight top expense categories.
      4. Monthly Outlook: Brief comment on financial health.

      Keep it professional, encouraging, and concise. Use bullet points and emojis where appropriate.
      
      Data:
      ${summary}`,
      config: {
        maxOutputTokens: 800,
      }
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Could not generate insights at this time.";
  }
};