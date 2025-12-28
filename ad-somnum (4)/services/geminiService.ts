
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { TRANSLATIONS } from "../constants";
import { Language } from "../types";

const getRejectionMessages = (lang: Language) => {
  const t = TRANSLATIONS[lang];
  return [t.hipnosReject1, t.hipnosReject2, t.hipnosReject3].join(' || ');
};

export const createHipnosChat = (ai: GoogleGenAI, lang: Language): Chat => {
  const t = TRANSLATIONS[lang];
  const rejectionMessages = getRejectionMessages(lang);
  
  const systemInstruction = `
    You are Hipnos, an AI assistant dedicated EXCLUSIVELY to helping users with sleep, insomnia, and sleep hygiene.
    
    Current Language: ${lang}
    
    Rules:
    1. Answer ONLY questions related to sleep, insomnia, dreams (scientifically), resting habits, and relaxation techniques.
    2. If a user asks about anything else (politics, coding, general knowledge, math, etc.), you MUST refuse to answer.
    3. When refusing, choose one of these exact messages:
       "${rejectionMessages}"
    4. Be empathetic, calm, and soothing. Use a dark, mysterious but comforting tone.
    5. Always reply in the language: ${lang}.
  `;

  // Fix: Use 'gemini-3-flash-preview' for basic text tasks as per guidelines.
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    },
  });
};

export const validateTenguInput = async (ai: GoogleGenAI, habits: string): Promise<boolean> => {
  const systemInstruction = `
    You are a validator for a sleep app.
    Your task is to determine if the user input describes bad habits, sleep problems, or nightly routines relevant to insomnia.
    
    Valid examples: "uso el movil", "ceno tarde", "tengo ansiedad", "no puedo dormir", "café por la noche".
    Invalid examples: "me gusta el futbol", "quien gano el mundial", "dime un chiste", "hola que tal", "matematicas".
    
    Return EXCLUSIVELY a JSON object with a single boolean property "isValid".
  `;

  try {
    // Fix: Use 'gemini-3-flash-preview' for basic validation tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Is this relevant to sleep habits? Input: "${habits}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN }
          },
          required: ["isValid"]
        },
        temperature: 0.1,
      },
    });
    // Fix: Directly access the .text property from the response.
    const result = JSON.parse(response.text || '{"isValid": false}');
    return result.isValid;
  } catch (e) {
    console.error("Validation error", e);
    return true; // Fallback to true to not block the user if AI fails
  }
};

export const generateTenguPlan = async (
  ai: GoogleGenAI, 
  lang: Language, 
  dinnerTime: string, 
  bedTime: string, 
  habits: string
): Promise<any[]> => {
  
  const systemInstruction = `
    You are Tengu, a strict and disciplined sleep architect.
    
    CRITICAL TASK: Create a highly personalized NIGHT routine for the user.
    
    PRIORITY ORDER:
    1. BAD HABITS / CURRENT ISSUES: "${habits}". This is the CORE of the plan. Every step in the protocol MUST address one or more of these habits to ensure a practical solution to their insomnia.
    2. DINNER & BEDTIME: [Dinner: ${dinnerTime}, Bed: ${bedTime}]. Use these as bounds.
    
    RULES:
    - Focus ONLY on the night routine (from dinner to sleep).
    - Relate each action directly to the bad habits mentioned. For example, if they use the phone in bed, include a "Digital Sunset" action.
    - Be strict, efficient, and practical.
    - Return the plan EXCLUSIVELY in JSON format as an array of objects.
    - Language for content: ${lang}.
  `;

  // Fix: Use 'gemini-3-pro-preview' for complex reasoning and planning tasks.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: 'Generate the personalized night protocol JSON.',
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: "The specific time for the action" },
            action: { type: Type.STRING, description: "The specific discipline/activity to perform" },
            why: { type: Type.STRING, description: "How this specifically targets the user's bad habits or problems" }
          },
          required: ["time", "action", "why"],
          propertyOrdering: ["time", "action", "why"]
        }
      },
      temperature: 0.4, 
    },
  });

  try {
    // Fix: Directly access the .text property from the response.
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Tengu JSON", e);
    return [];
  }
};
