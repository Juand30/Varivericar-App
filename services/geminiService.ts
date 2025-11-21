import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Converts a File object to a Base64 string for the API
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the Data-URL declaration (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes vehicle damage images using Gemini
 */
export const analyzeDamageImages = async (
  files: File[],
  contextInfo: string
): Promise<string> => {
  try {
    if (!apiKey) throw new Error("API Key missing");

    const imageParts = await Promise.all(files.map(fileToGenerativePart));

    const prompt = `
      Actúa como un perito experto en varillaje y reparación de granizo (PDR).
      Analiza la imagen y genera un REPORTE TÉCNICO MUY SIMPLIFICADO Y ESQUEMÁTICO para un administrador.
      
      Información del técnico: "${contextInfo}"

      FORMATO DE RESPUESTA REQUERIDO (Usa viñetas):
      
      * DAÑOS DETECTADOS: [Lista breve de abolladuras/golpes visuales]
      * PIEZAS AFECTADAS: [Capó, Techo, Parantes, etc.]
      * GRAVEDAD ESTIMADA: [Leve / Media / Severa]
      * RECOMENDACIÓN: [Varillas / Pintura necesaria / Cambio pieza]

      IMPORTANTE: No escribas introducciones, saludos ni conclusiones. Solo entrega la lista de datos concreta.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [...imageParts, { text: prompt }]
      }
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error analyzing images:", error);
    return "Error al conectar con el servicio de IA para análisis. Verifique su conexión.";
  }
};

/**
 * Chat with the AI assistant
 */
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  try {
    if (!apiKey) throw new Error("API Key missing");

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `Eres "VarillaBot", el asistente virtual experto de una empresa líder en reparación de granizo (Varilleros Pro).
        Tu tono es profesional, amable y técnico.
        
        Ayudas a:
        1. Técnicos a dudas sobre procedimientos PDR (Paintless Dent Repair).
        2. Clientes a entender el proceso de reparación sin pintura.
        3. Resolver dudas sobre la app.
        
        Si te preguntan precios, di que dependen de la evaluación presencial.
        Sé conciso.`,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Lo siento, no entendí eso.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Tuve un problema de conexión. Intenta de nuevo.";
  }
};