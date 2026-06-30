import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query, run, get } from './db.js';
import { getMockResponse } from './mockAgent.js';

dotenv.config();


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = "You are a customer support executive of Digital Friend. Answer politely in less than 150 words.";


async function callGemini(messages, apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API Key is missing.");

  
  const contents = [];
  
  
  
  const geminiHistory = messages.map((msg, idx) => {
    let text = msg.content;
    if (idx === 0 && msg.role === 'user') {
      text = `[System Instructions: ${SYSTEM_PROMPT}]\n\n${text}`;
    }
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }]
    };
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: geminiHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Failed to communicate with Gemini API.");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response received from Gemini.");
  return text;
}

async function generateResponse(history, provider, customApiKey, userContent) {
  const activeProvider = provider || process.env.DEFAULT_PROVIDER || 'mock';
  
  if (activeProvider === 'gemini') {
    const formattedHistory = history.map(h => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.content
    }));
    return await callGemini(formattedHistory, customApiKey);
  } else {
    
    return getMockResponse(userContent);
  }
}


async function generateChatTitle(content, provider, apiKey) {
  const activeProvider = provider || process.env.DEFAULT_PROVIDER || 'mock';
  
  if (activeProvider === 'gemini') {
    try {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (key) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${key}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: `Summarize this user query into a short 2-4 word title for a customer support chat (e.g. 'SEO Services', 'Web Development', 'Job Application'). Return ONLY the title, no quotes, no markdown: "${content}"` }]
            }],
            generationConfig: {
              maxOutputTokens: 20,
              temperature: 0.5
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          let title = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (title) {
            title = title.replace(/["']/g, '').trim();
            if (title.length > 30) title = title.substring(0, 27) + '...';
            return title;
          }
        }
      }
    } catch (err) {
      console.warn("Failed to generate AI chat title:", err.message);
    }
  }

  
  const query = content.toLowerCase();
  if (query.includes('marketing') || query.includes('seo') || query.includes('traffic') || query.includes('google')) {
    return 'Digital Marketing';
  }
  if (query.includes('website') || query.includes('web') || query.includes('develop') || query.includes('design') || query.includes('coding')) {
    return 'Web Development';
  }
  if (query.includes('brand') || query.includes('logo') || query.includes('graphic') || query.includes('creative')) {
    return 'Branding & Design';
  }
  if (query.includes('job') || query.includes('career') || query.includes('intern') || query.includes('apply')) {
    return 'Careers & Jobs';
  }
  if (query.includes('price') || query.includes('cost') || query.includes('rate') || query.includes('quote') || query.includes('fees')) {
    return 'Pricing Inquiry';
  }
  if (query.includes('contact') || query.includes('phone') || query.includes('number') || query.includes('email') || query.includes('call') || query.includes('location')) {
    return 'Contact Info';
  }
  if (query.includes('service') || query.includes('offer') || query.includes('capabilities')) {
    return 'Services Offered';
  }
  
  
  const words = content.trim().split(/\s+/);
  if (words.length > 0 && words[0].length > 1) {
    const firstWord = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    return `${firstWord} Chat`;
  }
  return 'General Inquiry';
}




app.get('/api/chats', async (req, res) => {
  try {
    const chats = await query('SELECT * FROM chats ORDER BY created_at DESC');
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve chats' });
  }
});


app.post('/api/chats', async (req, res) => {
  const { title } = req.body;
  const id = crypto.randomUUID();
  const chatTitle = title || 'New Chat';
  
  try {
    await run('INSERT INTO chats (id, title) VALUES (?, ?)', [id, chatTitle]);
    res.status(201).json({ id, title: chatTitle, created_at: new Date() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});


app.delete('/api/chats/:id', async (req, res) => {
  const { id } = req.params;
  try {
    
    const result = await run('DELETE FROM chats WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});


app.get('/api/chats/:id/messages', async (req, res) => {
  const { id } = req.params;
  try {
    const messages = await query('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [id]);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});


app.post('/api/chats/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const { content, provider, apiKey } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const userMsgId = crypto.randomUUID();
  const assistantMsgId = crypto.randomUUID();

  try {
    
    await run(
      'INSERT INTO messages (id, chat_id, sender, content) VALUES (?, ?, ?, ?)',
      [userMsgId, chatId, 'user', content]
    );

    
    const chat = await get('SELECT title FROM chats WHERE id = ?', [chatId]);
    if (chat && chat.title === 'New Chat') {
      const generatedTitle = await generateChatTitle(content, provider, apiKey);
      await run('UPDATE chats SET title = ? WHERE id = ?', [generatedTitle, chatId]);
    }

    
    const history = await query(
      'SELECT sender, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    );

    
    let aiResponse;
    try {
      aiResponse = await generateResponse(history, provider, apiKey, content);
    } catch (llmError) {
      console.warn("LLM API failed, falling back to mock support. Error:", llmError.message);
      
      const fallbackPrefix = provider && provider !== 'mock' 
        ? `*(API Connection Error: ${llmError.message}. Showing local response instead)*\n\n`
        : '';
      aiResponse = fallbackPrefix + getMockResponse(content);
    }

    
    await run(
      'INSERT INTO messages (id, chat_id, sender, content) VALUES (?, ?, ?, ?)',
      [assistantMsgId, chatId, 'assistant', aiResponse]
    );

    
    const updatedMessages = await query('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [chatId]);
    const updatedChats = await query('SELECT * FROM chats ORDER BY created_at DESC');
    res.json({ messages: updatedMessages, chats: updatedChats });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});


app.post('/api/chats/:chatId/messages/:messageId/regenerate', async (req, res) => {
  const { chatId, messageId } = req.params;
  const { provider, apiKey } = req.body;

  try {
    
    const msg = await get('SELECT * FROM messages WHERE id = ? AND chat_id = ?', [messageId, chatId]);
    if (!msg || msg.sender !== 'assistant') {
      return res.status(400).json({ error: 'Invalid message ID for regeneration' });
    }

    
    
    const allMessages = await query(
      'SELECT id, sender, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    );

    const targetIndex = allMessages.findIndex(m => m.id === messageId);
    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Message not found in context' });
    }

    
    const history = allMessages.slice(0, targetIndex);
    const lastUserMessage = history[history.length - 1];

    if (!lastUserMessage || lastUserMessage.sender !== 'user') {
      return res.status(400).json({ error: 'No preceding user message found' });
    }

    
    let aiResponse;
    try {
      aiResponse = await generateResponse(history, provider, apiKey, lastUserMessage.content);
    } catch (llmError) {
      console.warn("LLM API failed on regeneration, falling back to mock support. Error:", llmError.message);
      const fallbackPrefix = provider && provider !== 'mock'
        ? `*(API Connection Error: ${llmError.message}. Showing local response instead)*\n\n`
        : '';
      aiResponse = fallbackPrefix + getMockResponse(lastUserMessage.content);
    }

    
    await run('UPDATE messages SET content = ? WHERE id = ?', [aiResponse, messageId]);

    
    const updatedMessages = await query('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [chatId]);
    res.json(updatedMessages);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate message' });
  }
});


app.get('/api/chats/:chatId/export', async (req, res) => {
  const { chatId } = req.params;
  const { format } = req.query; 

  try {
    const chat = await get('SELECT * FROM chats WHERE id = ?', [chatId]);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await query('SELECT sender, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [chatId]);

    if (format === 'json') {
      res.setHeader('Content-disposition', `attachment; filename=chat-${chatId}.json`);
      res.setHeader('Content-type', 'application/json');
      return res.json({ chat, messages });
    } else {
      
      let textContent = `Digital Friend Chat Transcript\n`;
      textContent += `Session ID: ${chat.id}\n`;
      textContent += `Topic: ${chat.title}\n`;
      textContent += `Date: ${chat.created_at}\n`;
      textContent += `========================================\n\n`;

      messages.forEach(msg => {
        const senderLabel = msg.sender === 'user' ? 'USER' : 'SUPPORT AGENT (Digital Friend)';
        textContent += `[${new Date(msg.created_at).toLocaleTimeString()}] ${senderLabel}:\n`;
        textContent += `${msg.content}\n`;
        textContent += `----------------------------------------\n`;
      });

      res.setHeader('Content-disposition', `attachment; filename=chat-${chatId}.txt`);
      res.setHeader('Content-type', 'text/plain');
      return res.send(textContent);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export chat' });
  }
});


function saveToEnv(settings) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const updates = {
    DEFAULT_PROVIDER: settings.provider,
    GEMINI_API_KEY: settings.geminiApiKey
  };

  const lines = envContent.split('\n');
  const keysToUpdate = Object.keys(updates);
  const updatedLines = [];
  const processedKeys = new Set();

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) {
      updatedLines.push(line);
      continue;
    }
    const parts = trimmed.split('=');
    const cleanKey = parts[0].trim();
    if (keysToUpdate.includes(cleanKey)) {
      updatedLines.push(`${cleanKey}=${updates[cleanKey]}`);
      processedKeys.add(cleanKey);
    } else {
      updatedLines.push(line);
    }
  }

  for (let key of keysToUpdate) {
    if (!processedKeys.has(key)) {
      updatedLines.push(`${key}=${updates[key]}`);
    }
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  
  
  process.env.DEFAULT_PROVIDER = settings.provider;
  process.env.GEMINI_API_KEY = settings.geminiApiKey;
}


app.get('/api/settings', (req, res) => {
  res.json({
    provider: process.env.DEFAULT_PROVIDER || 'mock',
    geminiApiKey: process.env.GEMINI_API_KEY || ''
  });
});


app.post('/api/settings', (req, res) => {
  try {
    const { provider, geminiApiKey } = req.body;
    saveToEnv({ provider, geminiApiKey });
    res.json({ 
      success: true, 
      message: 'Settings saved and applied successfully!',
      settings: {
        provider: process.env.DEFAULT_PROVIDER,
        geminiApiKey: process.env.GEMINI_API_KEY
      }
    });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
