'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  showSuggestions?: boolean;
}

const suggestions = [
  { label: 'Patients chroniques du jour', icon: '🏥' },
  { label: 'Patients a relancer cette semaine', icon: '📞' },
  { label: 'Statistiques de la semaine', icon: '📊' },
  { label: 'Generer un message de relance', icon: '✉️' },
];

export default function ChatInput({ onSend, disabled, showSuggestions = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Min 1 line (~24px + padding), max 6 lines (~144px + padding)
      textareaRef.current.style.height = `${Math.min(scrollHeight, 168)}px`;
    }
  }, [input]);

  // Autofocus when not disabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion);
  };

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-sm">
      {/* Suggestion pills - shown only when chat is empty */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pt-3 pb-1"
          >
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <motion.button
                  key={s.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSuggestionClick(s.label)}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:border-[#52B788] hover:bg-[#2D6A4F]/5 hover:text-[#2D6A4F] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="px-4 py-3">
        <div className="relative flex items-end bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-[#52B788] focus-within:ring-2 focus-within:ring-[#2D6A4F]/10 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '168px' }}
          />

          {/* Send button */}
          <div className="flex-shrink-0 p-1.5 pr-2">
            <motion.button
              type="submit"
              disabled={disabled || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-xl transition-all duration-200 ${
                input.trim() && !disabled
                  ? 'bg-gradient-to-r from-[#2D6A4F] to-[#40916C] text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Entree pour envoyer &middot; Shift+Entree pour un saut de ligne
        </p>
      </form>
    </div>
  );
}
