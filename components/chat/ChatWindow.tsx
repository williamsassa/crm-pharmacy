'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatWindowProps {
  conversationId: string | null;
  messages: ChatMessageType[];
  onMessagesChange: (messages: ChatMessageType[]) => void;
  conversationTitle: string;
  onTitleChange: (title: string) => void;
  onFirstMessage?: (message: string) => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function ChatWindow({
  conversationId,
  messages,
  onMessagesChange,
  conversationTitle,
  onTitleChange,
  onFirstMessage,
  onToggleSidebar,
  sidebarOpen,
}: ChatWindowProps) {
  const { getFreshToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(conversationTitle);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Update title draft when prop changes
  useEffect(() => {
    setTitleDraft(conversationTitle);
  }, [conversationTitle]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ─────────────────────────────────────────
     SSE streaming – preserved from original
     ───────────────────────────────────────── */
  const sendMessage = async (content: string) => {
    // If this is the first user message in a new conversation, notify parent
    if (messages.length === 0 && onFirstMessage) {
      onFirstMessage(content);
    }

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    onMessagesChange(updatedMessages);
    setLoading(true);

    const assistantId = crypto.randomUUID();
    setStreamingId(assistantId);

    const withPlaceholder = [
      ...updatedMessages,
      { id: assistantId, role: 'assistant' as const, content: '', timestamp: new Date().toISOString() },
    ];
    onMessagesChange(withPlaceholder);

    try {
      const conversationHistory = updatedMessages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.content,
      }));

      // Get a fresh token before every API call to avoid expired token errors
      const freshToken = await getFreshToken();

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!res.ok) {
        throw new Error("Erreur de communication avec l'IA");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.text) {
                fullText += parsed.text;
                onMessagesChange(
                  withPlaceholder.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m
                  )
                );
              }
            } catch {
              // skip malformed SSE chunks
            }
          }
        }
      }

      if (!fullText) {
        onMessagesChange(
          withPlaceholder.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Desolee, je n'ai pas pu generer de reponse. Veuillez reessayer." }
              : m
          )
        );
      }
    } catch (error) {
      onMessagesChange(
        withPlaceholder.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `Erreur : ${error instanceof Error ? error.message : 'Erreur de communication'}. Veuillez reessayer.`,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
      setStreamingId(null);
    }
  };

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== conversationTitle) {
      onTitleChange(titleDraft.trim());
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* ──── Header ──── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        {/* Hamburger for mobile / toggle sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={sidebarOpen ? 'Masquer les conversations' : 'Afficher les conversations'}
        >
          {sidebarOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* AI icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D6A4F] to-[#52B788] flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Title (editable) */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitleDraft(conversationTitle);
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="text-sm font-semibold text-gray-800 bg-transparent border-b-2 border-[#2D6A4F] outline-none w-full py-0.5"
            />
          ) : (
            <h2
              onClick={() => {
                if (conversationId) setEditingTitle(true);
              }}
              className="text-sm font-semibold text-gray-800 truncate cursor-pointer hover:text-[#2D6A4F] transition-colors"
              title="Cliquer pour renommer"
            >
              {conversationTitle || 'Chat IA'}
            </h2>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
            <p className="text-[11px] text-gray-400">Assistant IA en ligne</p>
          </div>
        </div>
      </div>

      {/* ──── Messages area ──── */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* ── Empty state / Welcome ── */
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-md"
            >
              {/* AI logo */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#52B788] flex items-center justify-center shadow-lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Assistant IA Pharmacie
              </h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Interrogez l&apos;IA sur vos patients, demandez des statistiques,
                ou generez des messages de relance personnalises.
              </p>

              {/* Quick action cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  {
                    title: 'Analyse patients',
                    desc: 'Patients chroniques, a risque...',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Statistiques',
                    desc: 'Chiffres de la semaine, tendances...',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Relances',
                    desc: 'Generer des messages personnalises...',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Aide CRM',
                    desc: "Questions sur l'utilisation...",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ),
                  },
                ].map((card) => (
                  <motion.div
                    key={card.title}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 bg-white rounded-xl border border-gray-100 hover:border-[#52B788]/30 hover:shadow-md transition-all duration-200 cursor-default"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-[#2D6A4F]/10 flex items-center justify-center">
                        {card.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{card.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 ml-9">{card.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* ── Message list ── */
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 space-y-5 max-w-4xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={message.id === streamingId && loading}
                />
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && streamingId && messages.find((m) => m.id === streamingId)?.content === '' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#40916C] to-[#52B788] flex items-center justify-center shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-[#2D6A4F] rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-[#40916C] rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-[#52B788] rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ──── Input ──── */}
      <ChatInput
        onSend={sendMessage}
        disabled={loading}
        showSuggestions={isEmpty}
      />
    </div>
  );
}
