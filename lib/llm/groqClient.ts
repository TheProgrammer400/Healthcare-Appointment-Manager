import Groq from 'groq-sdk';

if (typeof window !== 'undefined') {
  throw new Error('Groq client must NEVER be imported or used in the browser context');
}

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('[Groq Client Warning]: GROQ_API_KEY is not defined in environment variables.');
}

export const groq = new Groq({
  apiKey: apiKey || 'dummy-key-for-initialization',
});

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
