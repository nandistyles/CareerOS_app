
import React, { useState, useEffect, useRef } from 'react';
import { Bot, ChevronDown, ChevronUp, Send, Zap, ArrowRight, X, Loader2, Mic } from 'lucide-react';
import { ViewState, UserProfile, AIMessage } from '../types';
import { chatWithNexus } from '../services/geminiService';

interface ChiefOfStaffProps {
    user: UserProfile;
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
}

export const ChiefOfStaff: React.FC<ChiefOfStaffProps> = ({ user, currentView, onChangeView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Initial Greeting & Proactive Messaging
    useEffect(() => {
        if (messages.length === 0) {
            setTimeout(() => {
                const name = user.name ? user.name.split(' ')[0] : 'there';
                const initialMsg: AIMessage = {
                    id: 'init-1',
                    role: 'assistant',
                    content: `Hello ${name}. I am Nexus, your Chief of Staff. I can access real-time market data, analyze contracts, and manage your schedule.`,
                    timestamp: new Date(),
                };
                setMessages([initialMsg]);
                
                // Context-aware nudges
                if (currentView === 'dashboard') {
                    setTimeout(() => {
                        addMessage({
                            id: 'insight-1',
                            role: 'assistant',
                            content: `I'm monitoring the gazette for "${user.industry}" updates. Would you like a market summary?`,
                            timestamp: new Date(),
                        });
                    }, 2000);
                }
            }, 1000);
        }
    }, [currentView, user.name, user.industry]);

    const addMessage = (msg: AIMessage) => {
        setMessages(prev => [...prev, msg]);
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        
        const userMsg: AIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };
        addMessage(userMsg);
        setInputValue('');
        setIsThinking(true);

        const context = `
            User Name: ${user.name}
            Company: ${user.companyName}
            Industry: ${user.industry}
            Role: ${user.role}
            Current View: ${currentView}
            Primary Focus: ${user.primaryFocus || 'General'}
        `;

        const historyForApi = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
        }));

        try {
            const responseText = await chatWithNexus(userMsg.content, context, historyForApi);
            
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date(),
                actionLink: responseText.toLowerCase().includes('finance') ? { label: "Go to Dashboard", view: 'dashboard' } :
                           responseText.toLowerCase().includes('tender') ? { label: "View Tenders", view: 'dashboard' } : undefined
            });
        } catch (error) {
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble accessing the network. Please try again.",
                timestamp: new Date()
            });
        } finally {
            setIsThinking(false);
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Voice input is not supported in this browser.");
            return;
        }
        
        setIsListening(true);
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
            setIsListening(false);
            // Optional: Auto-send
            // setTimeout(() => handleSend(), 500); 
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform group animate-in slide-in-from-bottom-10"
            >
                <div className="relative">
                    <Bot size={24} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 dark:border-white animate-pulse"></span>
                </div>
                <span className="font-bold pr-1">Nexus AI</span>
                <span className="bg-white/20 dark:bg-slate-900/10 px-2 py-0.5 rounded text-xs font-mono">CHIEF OF STAFF</span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 w-full md:w-[400px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${minimized ? 'h-20' : 'h-[600px]'}`}>
            {/* Header */}
            <div 
                className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl text-white"
                onClick={() => setMinimized(!minimized)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Nexus</h3>
                        <p className="text-[10px] text-blue-100 opacity-90">Chief of Staff • Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {minimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1 hover:bg-white/20 rounded-full"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!minimized && (
                <>
                    {/* Chat Area */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0B0F19]"
                    >
                        <div className="text-center py-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</span>
                        </div>
                        
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    
                                    {msg.actionLink && (
                                        <button 
                                            onClick={() => onChangeView(msg.actionLink!.view)}
                                            className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors self-start"
                                        >
                                            <Zap size={12} fill="currentColor" />
                                            {msg.actionLink.label}
                                            <ArrowRight size={12} />
                                        </button>
                                    )}
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                    <span className="text-xs text-slate-500">Nexus is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <input 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask Nexus..."
                                className="w-full pl-10 pr-12 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                                disabled={isThinking || isListening}
                            />
                            <button 
                                onClick={startListening}
                                className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700'}`}
                            >
                                <Mic size={18} />
                            </button>
                            <button 
                                onClick={handleSend}
                                disabled={isThinking || !inputValue.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
