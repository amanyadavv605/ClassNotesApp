// src/utils/summarizeImageWithGemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCHL2BbZkYLrGwXy6W_DQWcG1F2mtHH3G4"); // Replace with your Gemini API Key

export const summarizeImageWithGemini = async (base64Image) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];

    const result = await model.generateContent([
      "Summarize the main points or notice from this image in hinglish:",
      ...imageParts,
    ]);

    const response = await result.response;
    const text = response.text();
    return text;
  } catch (err) {
    console.error("Gemini AI Summarization Error:", err);
    return "Failed to summarize image.";
  }
};
