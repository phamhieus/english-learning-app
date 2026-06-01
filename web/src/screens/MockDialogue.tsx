import React, { useState, useEffect } from 'react';
import { Mic, Send, MoreVertical, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../components/classNames';
import { useSettings } from '../components/useSettings';
import { UnifiedChatSession } from '../services/ai';
import { useSpeechRecognition } from '../services/useSpeechRecognition';

const MockDialogue = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const title = location.state?.title || "Ordering at a Restaurant";
  
  const [messages, setMessages] = useState<{id: string, sender: 'user'|'ai', text: string}[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [timer, setTimer] = useState(120); // 2 mins

  const speech = useSpeechRecognition();
  const recognizedText = speech.transcript + (speech.interimTranscript ? ' ' + speech.interimTranscript : '');

  const chatSessionRef = React.useRef<UnifiedChatSession | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const chat = new UnifiedChatSession(settings, `You are an English coach playing a roleplay game. The scenario is: "${title}". You will start the conversation. Keep responses very short, natural, and conversational (1-2 sentences max).`);
        chatSessionRef.current = chat;

        setIsTyping(true);
        const resultText = await chat.sendMessage("Start the conversation.");
        setMessages([{ id: Date.now().toString(), sender: 'ai', text: resultText }]);
        setIsTyping(false);
      } catch (e) {
        console.error(e);
      }
    };
    initChat();

    const t = setInterval(() => setTimer(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [settings, title]);

  const toggleRecording = () => {
    if (speech.isListening) {
      const finalText = speech.stop();
      if (finalText) {
        sendMessage(finalText);
      }
    } else {
      speech.start();
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setInputText("");
    setIsTyping(true);
    
    try {
      const resultText = await chatSessionRef.current.sendMessage(text);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: resultText }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: "Sorry, I lost connection. Let's try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText) {
      sendMessage(inputText);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col glass-card rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0 bg-white/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg leading-tight">{title}</h2>
            <p className="text-xs text-slate-500 font-medium">Roleplay</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-mono text-sm font-bold rounded-md">
            {formatTime(timer)}
          </div>
          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {messages.map(m => (
          <div key={m.id} className={cn("flex max-w-[80%]", m.sender === 'user' ? "ml-auto" : "mr-auto")}>
            {m.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-1 shrink-0">
                🤖
              </div>
            )}
            <div className={cn(
              "p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed",
              m.sender === 'user' 
                ? "bg-indigo-600 text-white rounded-tr-sm" 
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-700"
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex max-w-[80%] mr-auto">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-1 shrink-0">
               🤖
             </div>
             <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm flex items-center gap-1">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input */}
      <form onSubmit={handleManualSubmit} className="p-4 bg-white/50 dark:bg-slate-900/50 border-t border-[var(--border)] shrink-0 flex flex-col gap-2">
        {recognizedText && <div className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 italic">"{recognizedText}"</div>}
        <div className="flex gap-4 items-center">
          <button 
            type="button"
            onClick={toggleRecording}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all",
              speech.isListening 
                ? "bg-indigo-600 dark:bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30" 
                : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800"
            )}
          >
            <Mic className={cn("w-5 h-5", speech.isListening && "animate-pulse")} />
          </button>
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={speech.isListening}
            placeholder={speech.isListening ? "Listening..." : "Type a message or click mic to speak..."}
            className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-full px-6 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MockDialogue;
