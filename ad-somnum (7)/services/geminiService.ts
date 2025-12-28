
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
    Eres Hipnos, un asistente de IA dedicado EXCLUSIVAMENTE a ayudar a los usuarios con el sueño, el insomnio y la higiene del sueño.
    
    Idioma actual: ${lang}
    
    Reglas:
    1. Responde ÚNICAMENTE preguntas relacionadas con el sueño, insomnio, sueños (científicamente), hábitos de descanso y técnicas de relajación.
    2. Si el usuario pregunta sobre cualquier otra cosa (política, programación, cultura general, matemáticas, etc.), DEBES negarte a responder.
    3. Al negarte, elige uno de estos mensajes exactos:
       "${rejectionMessages}"
    4. Sé empático, calmado y reconfortante. Usa un tono oscuro y misterioso pero acogedor.
    5. Responde siempre en el idioma: ${lang}.
  `;

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
    Eres un validador para una aplicación de sueño.
    Tu tarea es determinar si el texto del usuario describe malos hábitos, problemas de sueño o rutinas nocturnas relevantes.
    
    Ejemplos válidos: "uso el movil", "ceno tarde", "tengo ansiedad", "no puedo dormir", "café por la noche".
    Ejemplos inválidos: "me gusta el futbol", "quien gano el mundial", "dime un chiste", "hola que tal".
    
    Devuelve EXCLUSIVAMENTE un objeto JSON con una propiedad booleana "isValid".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `¿Es esto relevante para el sueño? Entrada: "${habits}"`,
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
    // Uso correcto de .text como propiedad
    const text = response.text || '{"isValid": false}';
    const result = JSON.parse(text);
    return result.isValid;
  } catch (e) {
    console.error("Error de validación", e);
    return true; 
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
    Eres Tengu, un arquitecto del sueño estricto y disciplinado.
    
    TAREA CRÍTICA: Crea una rutina NOCTURNA personalizada.
    
    PRIORIDAD:
    1. MALOS HÁBITOS: "${habits}". El protocolo DEBE atacar estos hábitos.
    2. HORARIOS: [Cena: ${dinnerTime}, Dormir: ${bedTime}].
    
    REGLAS:
    - Solo rutina nocturna.
    - Sé estricto y práctico.
    - Devuelve EXCLUSIVAMENTE un array JSON de objetos.
    - Idioma: ${lang}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: 'Genera el JSON del protocolo nocturno.',
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            action: { type: Type.STRING },
            why: { type: Type.STRING }
          },
          required: ["time", "action", "why"]
        }
      },
      temperature: 0.4, 
    },
  });

  try {
    // Uso correcto de .text como propiedad
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("Error al parsear Tengu JSON", e);
    return [];
  }
};
