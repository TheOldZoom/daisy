import { GoogleGenerativeAI } from "@google/generative-ai";

export default new GoogleGenerativeAI(process.env.GEMINI_KEY ?? "");
