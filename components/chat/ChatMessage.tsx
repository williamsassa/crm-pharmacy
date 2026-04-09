'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

/* ──────────────────────────────────────────────
   Simple markdown-ish renderer
   Supports: **bold**, *italic*, bullet lists,
   numbered lists, inline `code`, ```code blocks```
   ────────────────────────────────────────────── */
function renderMarkdown(text: string) {
  if (!text) return null;

  // Split by code blocks first
  const codeBlockRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
  const parts: { type: 'text' | 'code'; content: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.map((part, i) => {
    if (part.type === 'code') {
      return (
        <pre
          key={i}
          className="bg-gray-800 text-gray-100 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono leading-relaxed"
        >
          <code>{part.content}</code>
        </pre>
      );
    }
    return <span key={i}>{renderInlineMarkdown(part.content)}</span>;
  });
}

function renderInlineMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { ordered: boolean; content: string }[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${elements.length}`}
          className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} ml-4 my-1 space-y-0.5`}
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{formatInline(item.content)}</li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet list
    const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)/);
    if (bulletMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push({ ordered: false, content: bulletMatch[1] });
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^[\s]*\d+[.)]\s+(.+)/);
    if (numberedMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push({ ordered: true, content: numberedMatch[1] });
      continue;
    }

    flushList();

    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
    } else {
      elements.push(
        <span key={`line-${i}`}>
          {formatInline(line)}
          {i < lines.length - 1 ? '\n' : ''}
        </span>
      );
    }
  }

  flushList();
  return elements;
}

function formatInline(text: string): React.ReactNode {
  // Process bold, italic, inline code
  const parts: React.ReactNode[] = [];
  // Regex for **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let lastIdx = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index));
    }
    if (m[2]) {
      parts.push(<strong key={m.index}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(<em key={m.index}>{m[3]}</em>);
    } else if (m[4]) {
      parts.push(
        <code key={m.index} className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
          {m[4]}
        </code>
      );
    }
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

/* ──────────────────────────────────────────────
   Main ChatMessage Component
   ────────────────────────────────────────────── */
export default function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const timeString = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-start gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D6A4F] to-[#52B788] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-semibold">U</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#40916C] to-[#52B788] flex items-center justify-center shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Message Bubble */}
      <div className="flex flex-col max-w-[75%] min-w-0">
        <div
          className={`relative px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-[#2D6A4F] to-[#40916C] text-white rounded-2xl rounded-tr-md shadow-md'
              : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-md shadow-sm'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {isUser ? message.content : renderMarkdown(message.content)}
            {isStreaming && !isUser && (
              <span className="inline-block w-1.5 h-4 bg-[#2D6A4F] ml-0.5 animate-pulse rounded-sm align-middle" />
            )}
          </div>
        </div>

        {/* Hover actions row */}
        <div
          className={`flex items-center gap-2 mt-1 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Timestamp */}
          <motion.span
            initial={false}
            animate={{ opacity: showTimestamp ? 1 : 0 }}
            className="text-[10px] text-gray-400 select-none"
          >
            {timeString}
          </motion.span>

          {/* Copy button */}
          {message.content && (
            <motion.button
              initial={false}
              animate={{ opacity: showTimestamp ? 1 : 0 }}
              onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Copier"
            >
              {copied ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
