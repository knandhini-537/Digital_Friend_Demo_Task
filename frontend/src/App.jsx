import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Send, 
  Settings, 
  Download, 
  Copy, 
  RefreshCw, 
  Sun, 
  Moon, 
  X, 
  Bot, 
  User, 
  AlertCircle,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';


function parseInlineMarkdown(text) {
  let parts = [text];
  
  
  parts = splitAndMap(parts, /(`[^`]+`)/g, (match) => (
    <code key={Math.random()}>{match.slice(1, -1)}</code>
  ));

  
  parts = splitAndMap(parts, /(\*\*[^*]+\*\*)/g, (match) => (
    <strong key={Math.random()}>{match.slice(2, -2)}</strong>
  ));

  
  parts = splitAndMap(parts, /(\[[^\]]+\]\([^)]+\))/g, (match) => {
    const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return (
        <a 
          key={Math.random()} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="markdown-link"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return match;
  });

  return parts;
}

function splitAndMap(parts, regex, mapFn) {
  const result = [];
  parts.forEach(part => {
    if (typeof part !== 'string') {
      result.push(part);
      return;
    }
    const splitParts = part.split(regex);
    splitParts.forEach(sp => {
      if (sp.match(regex)) {
        result.push(mapFn(sp));
      } else if (sp !== '') {
        result.push(sp);
      }
    });
  });
  return result;
}

function MarkdownText({ text }) {
  if (!text) return null;

  
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <pre key={index}>
              <code>{code.trim()}</code>
            </pre>
          );
        }
        
        const lines = part.split('\n');
        return (
          <div key={index}>
            {lines.map((line, lineIdx) => {
              const isBullet = line.match(/^[\*\-\+]\s+(.*)/);
              if (isBullet) {
                return (
                  <ul key={lineIdx} className="markdown-list">
                    <li>{parseInlineMarkdown(isBullet[1])}</li>
                  </ul>
                );
              }

              const isNumbered = line.match(/^\d+\.\s+(.*)/);
              if (isNumbered) {
                return (
                  <ol key={lineIdx} className="markdown-list">
                    <li>{parseInlineMarkdown(isNumbered[1])}</li>
                  </ol>
                );
              }

              if (line.trim() === '') {
                return <div key={lineIdx} style={{ height: '8px' }} />;
              }

              return <p key={lineIdx}>{parseInlineMarkdown(line)}</p>;
            })}
          </div>
        );
      })}
    </>
  );
}

export default function App() {
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingSpeechId, setIsPlayingSpeechId] = useState(null);

  
  const [provider, setProvider] = useState(localStorage.getItem('provider') || 'mock');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider);
        setGeminiApiKey(data.geminiApiKey);
        
        const activeKey = data.provider === 'gemini' ? data.geminiApiKey : '';
        setApiKey(activeKey);
        
        localStorage.setItem('provider', data.provider);
        localStorage.setItem('apiKey', activeKey);
      }
    } catch (err) {
      console.error('Failed to load settings from backend:', err);
    }
  };

  
  useEffect(() => {
    fetchChats();
    fetchSettings();
  }, []);

  
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputValue(prev => prev ? prev + ' ' + transcript : transcript);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats`);
      if (!res.ok) throw new Error('Failed to fetch conversations.');
      const data = await res.json();
      setChats(data);
      if (data.length > 0 && !activeChatId) {
        setActiveChatId(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages.');
      const data = await res.json();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateChat = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      });
      if (!res.ok) throw new Error('Failed to create new chat.');
      const newChat = await res.json();
      setChats([newChat, ...chats]);
      setActiveChatId(newChat.id);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteChat = async (id, e) => {
    e.stopPropagation(); 
    try {
      const res = await fetch(`${API_BASE_URL}/chats/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete chat.');
      const updatedChats = chats.filter(c => c.id !== id);
      setChats(updatedChats);
      
      
      if (activeChatId === id) {
        if (updatedChats.length > 0) {
          setActiveChatId(updatedChats[0].id);
        } else {
          setActiveChatId(null);
        }
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    let currentChatId = activeChatId;

    
    if (!currentChatId) {
      try {
        const res = await fetch(`${API_BASE_URL}/chats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Chat' })
        });
        if (!res.ok) throw new Error('Failed to start a new chat session.');
        const newChat = await res.json();
        setChats([newChat]);
        currentChatId = newChat.id;
        setActiveChatId(newChat.id);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);
    setError(null);

    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeechId(null);
    }

    
    const tempUserMsg = {
      id: 'temp-user',
      chat_id: currentChatId,
      sender: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${API_BASE_URL}/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageText,
          provider,
          apiKey
        })
      });

      if (!res.ok) throw new Error('Failed to receive response from server.');
      
      const data = await res.json();
      setMessages(data.messages);
      setChats(data.chats);
    } catch (err) {
      setError(err.message);
      
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageId) => {
    if (!activeChatId || regeneratingId) return;
    setRegeneratingId(messageId);
    setError(null);

    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeechId(null);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/chats/${activeChatId}/messages/${messageId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });

      if (!res.ok) throw new Error('Failed to regenerate response.');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (text, messageId) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSaveSettings = async (newProvider, selectedKey, newGeminiKey) => {
    setProvider(newProvider);
    setApiKey(selectedKey);
    setGeminiApiKey(newGeminiKey);

    localStorage.setItem('provider', newProvider);
    localStorage.setItem('apiKey', selectedKey);
    setShowSettings(false);

    try {
      await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newProvider,
          geminiApiKey: newGeminiKey
        })
      });
    } catch (err) {
      console.error('Failed to save settings to backend:', err);
    }
  };

  const handleExport = (format) => {
    if (!activeChatId) return;
    window.open(`${API_BASE_URL}/chats/${activeChatId}/export?format=${format}`);
  };

  
  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech-to-text input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  
  const handleSpeakText = (text, messageId) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech synthesis is not supported in this browser.");
      return;
    }

    if (isPlayingSpeechId === messageId) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel(); 

    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') 
      .replace(/\*([^*]+)\*/g, '$1')   
      .replace(/`([^`]+)`/g, '$1')     
      .replace(/```[\s\S]*?```/g, '')  
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsPlayingSpeechId(null);
    utterance.onerror = () => setIsPlayingSpeechId(null);

    setIsPlayingSpeechId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-container">
      {}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <Sparkles size={18} fill="currentColor" />
            </div>
            <span className="logo-text">Digital Friend</span>
          </div>
        </div>

        <button className="new-chat-btn" onClick={handleCreateChat}>
          <Plus size={18} />
          New Conversation
        </button>

        <div className="chat-history-list">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-history-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="chat-history-title-wrap">
                <MessageSquare size={16} />
                <span className="chat-history-title">{chat.title}</span>
              </div>
              <button 
                className="delete-chat-btn"
                onClick={(e) => handleDeleteChat(chat.id, e)}
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="footer-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="footer-btn" onClick={() => setShowSettings(true)}>
            <Settings size={16} />
            Settings & LLM
          </button>
        </div>
      </aside>

      {}
      <main className="chat-area">
        {}
        <header className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="chat-header-title">
              AI Support Assistant
            </span>
            <span className={`pill-indicator ${provider === 'mock' ? 'mock' : 'api'}`}>
              {provider} mode
            </span>
          </div>

          {activeChatId && (
            <div className="chat-header-actions">
              <button 
                className="action-icon-btn" 
                onClick={() => handleExport('text')} 
                title="Export as Text"
              >
                <Download size={16} />
              </button>
              <button 
                className="action-icon-btn" 
                onClick={() => handleExport('json')} 
                title="Export as JSON"
              >
                <Download size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          )}
        </header>

        {}
        {error && (
          <div className="error-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {}
        <div className="messages-container">
          {messages.length === 0 && !isLoading ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Bot size={32} />
              </div>
              <h2>How can I help you grow?</h2>
              <p>
                Welcome to Digital Friend support! Ask about our Digital Marketing, 
                Search Engine Optimization, Web Design, and Branding solutions. 
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className="avatar">
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-bubble-wrapper">
                  <div className="message-bubble">
                    <MarkdownText text={msg.content} />
                  </div>
                  
                  {}
                  {msg.id !== 'temp-user' && (
                    <div className={`bubble-actions ${isPlayingSpeechId === msg.id ? 'active' : ''}`}>
                      <button 
                        className="bubble-btn" 
                        onClick={() => handleCopyText(msg.content, msg.id)}
                        title="Copy message text"
                      >
                        {copiedMessageId === msg.id ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                      </button>
                      <button 
                        className="bubble-btn" 
                        onClick={() => handleSpeakText(msg.content, msg.id)}
                        title={isPlayingSpeechId === msg.id ? "Stop voice synthesis" : "Read message aloud"}
                      >
                        {isPlayingSpeechId === msg.id ? <VolumeX size={14} style={{ color: '#6366f1' }} /> : <Volume2 size={14} />}
                      </button>
                      {msg.sender === 'assistant' && (
                        <button 
                          className="bubble-btn" 
                          onClick={() => handleRegenerate(msg.id)}
                          title="Regenerate Response"
                          disabled={regeneratingId === msg.id}
                        >
                          <RefreshCw 
                            size={14} 
                            className={regeneratingId === msg.id ? 'animate-spin' : ''} 
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message-row assistant">
              <div className="avatar">
                <Bot size={16} />
              </div>
              <div className="message-bubble-wrapper">
                <div className="message-bubble" style={{ padding: '10px 14px' }}>
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {}
        <div className="input-area">
          <form onSubmit={handleSendMessage}>
            <div className="input-container">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Ask a question about Digital Friend..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
              />
              
              {/* Mic Icon toggle button */}
              <button
                type="button"
                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={handleToggleVoiceInput}
                title={isRecording ? "Stop voice recording" : "Speak to write your message"}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button 
                type="submit" 
                className="send-btn" 
                disabled={!inputValue.trim() || isLoading}
              >
                <Send size={16} />
              </button>
            </div>
          </form>
          <div className="input-footer-info">
            Digital Friend Support Executive answers polite & concise. Under 150 words.
          </div>
        </div>
      </main>

      {}
      {showSettings && (
        <SettingsModal 
          currentProvider={provider}
          currentGeminiKey={geminiApiKey}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}

function SettingsModal({ currentProvider, currentGeminiKey, onClose, onSave }) {
  const [provider, setProvider] = useState(currentProvider);
  const [geminiKey, setGeminiKey] = useState(currentGeminiKey);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(provider, provider === 'gemini' ? geminiKey : '', geminiKey);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Settings & LLM Configuration</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="provider-select">AI Provider</label>
              <select 
                id="provider-select" 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="mock">Mock Support Executive (No API Key Required)</option>
                <option value="gemini">Gemini API (Google)</option>
              </select>
              <span className="help-text">
                Mock mode works immediately. Gemini requires entering an API Key below.
              </span>
            </div>

            {provider !== 'mock' && (
              <div className="form-group">
                <label htmlFor="key-input">
                  Gemini API Key
                </label>
                <input 
                  type="password" 
                  id="key-input"
                  placeholder="Enter your Gemini API Key"
                  value={geminiKey} 
                  onChange={(e) => setGeminiKey(e.target.value)}
                  required
                />
                <span className="help-text">
                  Your key is saved directly to your server's backend .env file.
                </span>
              </div>
            )}

            <button 
              type="submit" 
              className="new-chat-btn" 
              style={{ margin: '12px 0 0 0', width: '100%' }}
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
