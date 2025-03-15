import Groq from "groq-sdk";

export default new Groq({
  apiKey: process.env.GROQ_KEY,
});
