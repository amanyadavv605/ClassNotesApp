// chatWithGemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyCHL2BbZkYLrGwXy6W_DQWcG1F2mtHH3G4"); // Replace with your Gemini API Key
export const chatWithGemini = async (query) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([query]);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (err) {
    console.error("Gemini AI Chat Error:", err);
    return "Failed to get response from AI.";
  }
};