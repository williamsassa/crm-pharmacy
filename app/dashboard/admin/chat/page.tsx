'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ConversationSidebar, {
  loadConversations,
  saveConversations,
  generateTitle,
  type Conversation,
} from '@/components/chat/ConversationSidebar';
import Spinner from '@/components/ui/Spinner';
import type { ChatMessage } from '@/types';

export default function ChatPage() {
  const { profile, loading } = useRequireAuth(['admin', 'superadmin']);

  /* ───── Conversation state ───── */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    if (loaded.length > 0) {
      // Open the most recent conversation
      const sorted = [...loaded].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setActiveId(sorted[0].id);
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    if (hydrated) {
      saveConversations(conversations);
    }
  }, [conversations, hydrated]);

  // Responsive: close sidebar by default on small screens
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ───── Conversation helpers ───── */
  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const handleNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: 'Nouvelle conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        if (activeId === id) {
          // Switch to the next most recent, or null
          const sorted = [...updated].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setActiveId(sorted[0]?.id ?? null);
        }
        return updated;
      });
    },
    [activeId]
  );

  const handleRenameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  const handleMessagesChange = useCallback(
    (messages: ChatMessage[]) => {
      if (!activeId) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, messages, updatedAt: new Date().toISOString() } : c
        )
      );
    },
    [activeId]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!activeId) return;
      handleRenameConversation(activeId, title);
    },
    [activeId, handleRenameConversation]
  );

  const handleFirstMessage = useCallback(
    (message: string) => {
      if (!activeId) return;
      const title = generateTitle(message);
      handleRenameConversation(activeId, title);
    },
    [activeId, handleRenameConversation]
  );

  /* ───── Auto-create first conversation if none exist ───── */
  useEffect(() => {
    if (hydrated && conversations.length === 0 && !activeId) {
      handleNewConversation();
    }
  }, [hydrated, conversations.length, activeId, handleNewConversation]);

  /* ───── Loading ───── */
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin navigation sidebar (original) */}
      <Sidebar profile={profile} />

      {/* Main content area (offset for admin sidebar) */}
      <main className="lg:ml-[272px] h-screen flex">
        {/* ─── Conversation Sidebar ─── */}
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />

        {/* ─── Chat Window ─── */}
        <div className="flex-1 min-w-0 h-screen">
          {activeConversation ? (
            <ChatWindow
              conversationId={activeConversation.id}
              messages={activeConversation.messages}
              onMessagesChange={handleMessagesChange}
              conversationTitle={activeConversation.title}
              onTitleChange={handleTitleChange}
              onFirstMessage={handleFirstMessage}
              onToggleSidebar={() => setSidebarOpen((v) => !v)}
              sidebarOpen={sidebarOpen}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#52B788] flex items-center justify-center shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Assistant IA Pharmacie</h3>
                <p className="text-sm text-gray-400 mb-4">Commencez une nouvelle conversation</p>
                <button
                  onClick={handleNewConversation}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#2D6A4F] to-[#40916C] hover:from-[#245a42] hover:to-[#388f60] shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nouvelle conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
