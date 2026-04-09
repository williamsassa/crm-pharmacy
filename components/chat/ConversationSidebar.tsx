'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '@/types';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

/* ──────────────────────────────────────────────
   Helper: relative time label
   ────────────────────────────────────────────── */
function relativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getPreview(conv: Conversation): string {
  const lastMsg = conv.messages[conv.messages.length - 1];
  if (!lastMsg) return 'Nouvelle conversation';
  return lastMsg.content.slice(0, 60) + (lastMsg.content.length > 60 ? '...' : '');
}

/* ──────────────────────────────────────────────
   LocalStorage helpers (exported for use by page)
   ────────────────────────────────────────────── */
const STORAGE_KEY = 'pharma-chat-conversations';

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversations(convs: Conversation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {
    // quota exceeded – silently fail
  }
}

export function generateTitle(firstMessage: string): string {
  // Take first ~40 chars of the user's first message as title
  const clean = firstMessage.replace(/\n/g, ' ').trim();
  return clean.length > 40 ? clean.slice(0, 40) + '...' : clean;
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  isOpen,
  onToggle,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const commitRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  /* ─ Overlay backdrop for mobile ─ */
  const backdrop = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}
    </AnimatePresence>
  );

  /* ─ Sidebar panel ─ */
  const panel = (
    <motion.aside
      initial={false}
      animate={{ x: isOpen ? 0 : -320 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        fixed top-0 left-0 h-full w-[280px] bg-white border-r border-gray-100 z-50
        flex flex-col
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? '' : 'lg:hidden'}
      `}
      style={{ willChange: 'transform' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Conversations
        </h2>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* New conversation button */}
      <div className="px-3 py-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#2D6A4F] to-[#40916C] hover:from-[#245a42] hover:to-[#388f60] shadow-md hover:shadow-lg transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle conversation
        </motion.button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sorted.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Aucune conversation</p>
            <p className="text-[10px] text-gray-400 mt-1">Cliquez sur &quot;Nouvelle conversation&quot; pour commencer</p>
          </div>
        )}

        {sorted.map((conv) => {
          const isActive = conv.id === activeId;
          const isHovered = conv.id === hoveredId;

          return (
            <motion.div
              key={conv.id}
              layout
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                onSelect(conv.id);
                // Close sidebar on mobile after selection
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`
                group relative flex items-start gap-2 px-3 py-2.5 mb-0.5 rounded-xl cursor-pointer
                transition-all duration-150
                ${isActive
                  ? 'bg-[#2D6A4F]/10 border border-[#2D6A4F]/20'
                  : 'hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#2D6A4F] rounded-r-full"
                />
              )}

              <div className="flex-1 min-w-0">
                {editingId === conv.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full text-sm px-1 py-0 border-b border-[#2D6A4F] bg-transparent outline-none text-gray-800"
                  />
                ) : (
                  <p
                    className={`text-sm font-medium truncate ${
                      isActive ? 'text-[#2D6A4F]' : 'text-gray-700'
                    }`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(conv.id, conv.title);
                    }}
                  >
                    {conv.title}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{getPreview(conv)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{relativeDate(conv.updatedAt)}</p>
              </div>

              {/* Delete button */}
              <AnimatePresence>
                {(isHovered || isActive) && editingId !== conv.id && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors mt-0.5"
                    title="Supprimer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.aside>
  );

  return (
    <>
      {backdrop}
      {panel}
    </>
  );
}
