"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// Simple icon components
const Send = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const Settings = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Zap = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const Brain = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const MessageCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const X = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

type Message = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    agent?: string;
    timestamp: number;
    streaming?: boolean;
};

type LLMProvider = {
    name: string;
    status: "online" | "offline" | "error";
    endpoint: string;
    models: string[];
};

interface LLMChatPanelProps {
    agents: Array<{ name: string; display_name: string; status: string }>;
    selectedAgentId?: string;
    onAgentSelect?: (agentId: string) => void;
    className?: string;
}

export default function LLMChatPanel({ agents, selectedAgentId, onAgentSelect, className = "" }: LLMChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(selectedAgentId || agents[0]?.name || "nova");
    const [selectedProvider, setSelectedProvider] = useState("ollama");
    const [providers, setProviders] = useState<LLMProvider[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1000);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load LLM providers
    useEffect(() => {
        const loadProviders = async () => {
            try {
                const res = await fetch("/api/llm/health");
                if (res.ok) {
                    const data = await res.json();
                    setProviders(data.providers || []);
                }
            } catch (err) {
                console.error("Failed to load LLM providers:", err);
            }
        };
        loadProviders();
        const interval = setInterval(loadProviders, 30000);
        return () => clearInterval(interval);
    }, []);

    // Update selected agent when prop changes
    useEffect(() => {
        if (selectedAgentId && selectedAgentId !== selectedAgent) {
            setSelectedAgent(selectedAgentId);
        }
    }, [selectedAgentId, selectedAgent]);

    const handleAgentChange = (agentId: string) => {
        setSelectedAgent(agentId);
        onAgentSelect?.(agentId);
    };

    const createMessage = (role: Message["role"], content: string, agent?: string): Message => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        role,
        content,
        agent,
        timestamp: Date.now()
    });

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage = createMessage("user", inputText.trim());
        const assistantMessageId = Date.now().toString() + "_assistant";
        const assistantMessage = createMessage("assistant", "", selectedAgent);
        assistantMessage.id = assistantMessageId;
        assistantMessage.streaming = true;

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInputText("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/llm/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        ...messages.filter(m => !m.streaming).map(m => ({
                            role: m.role,
                            content: m.content
                        })),
                        { role: "user", content: inputText.trim() }
                    ],
                    agent: selectedAgent,
                    provider: selectedProvider,
                    stream: true,
                    temperature,
                    max_tokens: maxTokens
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No reader available");
            }

            let accumulatedContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                accumulatedContent += content;
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: accumulatedContent, streaming: true }
                                            : msg
                                    )
                                );
                            }
                        } catch (err) {
                            console.error("Error parsing streaming data:", err);
                        }
                    }
                }
            }

            // Mark streaming as complete
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, streaming: false }
                        : msg
                )
            );

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: "Sorry, I encountered an error processing your request. Please try again.",
                            streaming: false
                        }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    const selectedAgentData = agents.find(a => a.name === selectedAgent);

    return (
        <div className={`flex flex-col bg-gradient-to-b from-[#1a0a1a]/90 to-[#0a0a0f]/95 backdrop-blur-xl border-l border-[#dc2626]/30 ${className}`}>
            {/* Header */}
            <header className="border-b border-[#dc2626]/20 bg-gradient-to-r from-[#1a0a1a]/80 to-transparent backdrop-blur p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl p-2 bg-gradient-to-r from-[#dc2626]/20 to-[#dc2626]/10 border border-[#dc2626]/50">
                            <Brain className="h-5 w-5 text-[#dc2626]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#e2e8f0] drop-shadow">Agent Intelligence Hub</h2>
                            <p className="text-sm text-[#6faab1] font-medium">Enhanced LLM Communication</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="rounded-xl border border-[#6faab1]/50 bg-gradient-to-r from-[#6faab1]/20 to-[#6faab1]/10 p-3 text-[#6faab1] hover:from-[#6faab1]/30 hover:to-[#6faab1]/20 transition-all duration-300 shadow-lg backdrop-blur-sm"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                        <button
                            onClick={clearChat}
                            className="rounded-xl border border-[#dc2626]/50 bg-gradient-to-r from-[#dc2626]/20 to-[#dc2626]/10 p-3 text-[#dc2626] hover:from-[#dc2626]/30 hover:to-[#dc2626]/20 transition-all duration-300 shadow-lg backdrop-blur-sm"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Agent & Provider Selection */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-[#94a3b8] font-semibold block mb-2">Agent</label>
                        <select
                            value={selectedAgent}
                            onChange={(e) => handleAgentChange(e.target.value)}
                            className="w-full rounded-xl border border-[#1a1a2a]/50 bg-gradient-to-r from-[#0a0a0f]/80 to-[#1a1a2a]/40 backdrop-blur-lg px-4 py-3 text-sm text-[#e2e8f0] focus:border-[#dc2626]/50 focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 transition-all duration-300"
                        >
                            {agents.map((agent) => (
                                <option key={agent.name} value={agent.name} className="bg-[#1a0a1a] text-[#e2e8f0]">
                                    {agent.display_name} ({agent.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-[#94a3b8] font-semibold block mb-2">Provider</label>
                        <select
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            className="w-full rounded-xl border border-[#1a1a2a]/50 bg-gradient-to-r from-[#0a0a0f]/80 to-[#1a1a2a]/40 backdrop-blur-lg px-4 py-3 text-sm text-[#e2e8f0] focus:border-[#dc2626]/50 focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 transition-all duration-300"
                        >
                            {providers.map((provider) => (
                                <option key={provider.name} value={provider.name} className="bg-[#1a0a1a] text-[#e2e8f0]">
                                    {provider.name} ({provider.status})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="mt-4 p-4 rounded-2xl border border-[#dc2626]/30 bg-gradient-to-r from-[#1a0a1a]/60 to-[#0a0a0f]/40 backdrop-blur-lg animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-[#94a3b8] font-semibold block mb-2">Temperature</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-[#1a1a2a] rounded-lg appearance-none cursor-pointer slider"
                                />
                                <span className="text-xs text-[#dc2626] font-bold">{temperature}</span>
                            </div>
                            <div>
                                <label className="text-xs text-studios-inkSteel-neutral block mb-1">Max Tokens</label>
                                <input
                                    type="number"
                                    min="100"
                                    max="4000"
                                    value={maxTokens}
                                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                    className="w-full rounded border border-blackRose-midnightNavy bg-blackRose-trueBlack px-2 py-1 text-xs text-blackRose-fg focus:border-blackRose-roseMauve focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-[#dc2626]/20 to-[#dc2626]/10 border border-[#dc2626]/50 flex items-center justify-center">
                            <MessageCircle className="h-8 w-8 text-[#dc2626]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#e2e8f0] mb-2">Ready for Intelligence</h3>
                        <p className="text-[#94a3b8] text-sm">
                            Start a conversation with <span className="font-semibold text-[#6faab1]">{selectedAgentData?.display_name || selectedAgent}</span>
                        </p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-5 py-4 ${message.role === "user"
                                ? "bg-gradient-to-r from-[#dc2626] to-[#dc2626]/90 text-white shadow-lg"
                                : "bg-gradient-to-r from-[#1a1a2a]/80 to-[#0a0a0f]/60 text-[#e2e8f0] border border-[#1a1a2a]/50 backdrop-blur-lg shadow-lg"
                                }`}
                        >
                            {message.role === "assistant" && (
                                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-[#1a1a2a]/30">
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#6faab1]/20 to-[#6faab1]/10 border border-[#6faab1]/50 flex items-center justify-center">
                                        <Zap className="h-3 w-3 text-[#6faab1]" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#6faab1]">
                                        {message.agent || selectedAgent}
                                    </span>
                                    {message.streaming && (
                                        <div className="w-4 h-4 border-2 border-[#6faab1]/30 border-t-[#6faab1] rounded-full animate-spin"></div>
                                    )}
                                </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {message.content}
                                {message.streaming && !message.content && (
                                    <span className="inline-flex items-center gap-2 text-[#6faab1]">
                                        <div className="w-4 h-4 border-2 border-[#6faab1]/30 border-t-[#6faab1] rounded-full animate-spin"></div>
                                        Processing...
                                    </span>
                                )}
                            </p>
                            <p className={`text-xs mt-3 opacity-70 font-semibold ${message.role === "user" ? "text-white/80" : "text-[#94a3b8]"
                                }`}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#dc2626]/20 bg-gradient-to-r from-[#1a0a1a]/80 to-transparent backdrop-blur p-6">
                <div className="flex gap-4">
                    <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${selectedAgentData?.display_name || selectedAgent}...`}
                        rows={1}
                        className="flex-1 rounded-2xl border border-[#1a1a2a]/50 bg-gradient-to-r from-[#0a0a0f]/80 to-[#1a1a2a]/40 backdrop-blur-lg px-5 py-4 text-sm text-[#e2e8f0] placeholder-[#94a3b8] resize-none focus:border-[#dc2626]/50 focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 transition-all duration-300"
                        style={{ minHeight: '50px', maxHeight: '120px' }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputText.trim() || isLoading}
                        className="rounded-2xl bg-gradient-to-r from-[#dc2626] to-[#dc2626]/80 p-4 text-white hover:from-[#dc2626]/90 hover:to-[#dc2626]/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg backdrop-blur-sm"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
