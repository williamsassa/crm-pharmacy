'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { generateWhatsAppUrl } from '@/lib/whatsapp';
import type { Patient } from '@/types';

interface PatientsTableProps {
  patients: Patient[];
  pharmacyName?: string;
  onPatientClick?: (patient: Patient) => void;
}

const SEGMENTS = [
  { label: 'Tous', value: 'all' },
  { label: 'Chronique', value: 'Chronique', color: '#2D6A4F', bg: 'rgba(45,106,79,0.08)' },
  { label: 'Risque', value: 'Risque', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  { label: 'Suivi regulier', value: 'Suivi régulier', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  { label: 'Occasionnel', value: 'Occasionnel', color: '#6C757D', bg: 'rgba(108,117,125,0.08)' },
];

function getSegmentStyle(segment: string | null) {
  switch (segment) {
    case 'Chronique':
      return { bg: 'rgba(45,106,79,0.1)', text: '#2D6A4F', border: 'rgba(45,106,79,0.2)' };
    case 'Risque':
      return { bg: 'rgba(220,38,38,0.08)', text: '#DC2626', border: 'rgba(220,38,38,0.15)' };
    case 'Suivi régulier':
      return { bg: 'rgba(37,99,235,0.08)', text: '#2563EB', border: 'rgba(37,99,235,0.15)' };
    case 'Occasionnel':
      return { bg: 'rgba(108,117,125,0.08)', text: '#6C757D', border: 'rgba(108,117,125,0.15)' };
    default:
      return { bg: 'rgba(108,117,125,0.06)', text: '#9CA3AF', border: 'rgba(108,117,125,0.1)' };
  }
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string | null) {
  const colors = [
    { bg: 'linear-gradient(135deg, #2D6A4F, #52B788)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #40916C, #74C69D)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #1B4F72, #2E86C1)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #52B788, #95D5B2)', text: '#fff' },
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function PatientsTable({ patients, pharmacyName = 'Pharmacie FATIMA', onPatientClick }: PatientsTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filtered = patients.filter((p) => {
    const matchSegment = filter === 'all' || p.segment_ia === filter;
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    return matchSegment && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Show max 5 page buttons
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div>
      {/* Search bar */}
      <div className="mb-5">
        <div
          className="relative max-w-md"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom ou telephone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] transition-all placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>

      {/* Segment filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {SEGMENTS.map((seg) => {
          const isActive = filter === seg.value;
          return (
            <motion.button
              key={seg.value}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setFilter(seg.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
              style={{
                background: isActive
                  ? seg.value === 'all'
                    ? 'linear-gradient(135deg, #2D6A4F, #40916C)'
                    : seg.bg || 'rgba(45,106,79,0.08)'
                  : 'rgba(255,255,255,0.8)',
                color: isActive
                  ? seg.value === 'all'
                    ? '#fff'
                    : seg.color || '#2D6A4F'
                  : '#6C757D',
                borderColor: isActive
                  ? seg.value === 'all'
                    ? '#2D6A4F'
                    : (seg.color || '#2D6A4F') + '30'
                  : 'rgba(0,0,0,0.06)',
                boxShadow: isActive ? '0 2px 8px rgba(45, 106, 79, 0.12)' : 'none',
              }}
            >
              {seg.label}
            </motion.button>
          );
        })}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
          boxShadow: '0 4px 24px rgba(45, 106, 79, 0.06), 0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(45,106,79,0.08)' }}>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#6C757D] uppercase tracking-widest">Patient</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#6C757D] uppercase tracking-widest">Telephone</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#6C757D] uppercase tracking-widest">Segment IA</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#6C757D] uppercase tracking-widest">Fidelite</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#6C757D] uppercase tracking-widest hidden lg:table-cell">Dernier motif</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#6C757D] uppercase tracking-widest hidden md:table-cell">Date</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-bold text-[#6C757D] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginated.map((patient, index) => {
                  const segStyle = getSegmentStyle(patient.segment_ia);
                  const avatarStyle = getAvatarColor(patient.name);
                  return (
                    <motion.tr
                      key={patient.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      className="group border-b cursor-pointer transition-all duration-200"
                      style={{ borderColor: 'rgba(0,0,0,0.03)' }}
                      onClick={() => onPatientClick?.(patient)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(45,106,79,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                      }}
                    >
                      {/* Patient name with avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: avatarStyle.bg, color: avatarStyle.text }}
                          >
                            {getInitials(patient.name)}
                          </div>
                          <span className="text-sm font-semibold text-[#1A1A2E] group-hover:text-[#2D6A4F] transition-colors">
                            {patient.name || 'Sans nom'}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 text-sm text-[#6C757D] font-medium">
                        {patient.phone}
                      </td>

                      {/* Segment IA - prominent */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                          style={{
                            background: segStyle.bg,
                            color: segStyle.text,
                            borderColor: segStyle.border,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: segStyle.text }}
                          />
                          {patient.segment_ia || 'Non classe'}
                        </span>
                      </td>

                      {/* Fidelity score */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${patient.score_fidelite}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + index * 0.05, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{
                                background: `linear-gradient(90deg, #2D6A4F, ${
                                  patient.score_fidelite > 70
                                    ? '#52B788'
                                    : patient.score_fidelite > 40
                                    ? '#40916C'
                                    : '#6C757D'
                                })`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#1A1A2E] min-w-[24px]">
                            {patient.score_fidelite}
                          </span>
                        </div>
                      </td>

                      {/* Last motif */}
                      <td className="px-5 py-3.5 text-sm text-[#6C757D] truncate max-w-[180px] hidden lg:table-cell">
                        {patient.motif_last_visit || '-'}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-sm text-[#6C757D] hidden md:table-cell">
                        {formatDate(patient.created_at)}
                      </td>

                      {/* WhatsApp action */}
                      <td className="px-5 py-3.5 text-right">
                        <a
                          href={generateWhatsAppUrl(patient.phone, patient.name || '', pharmacyName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:scale-110"
                          style={{
                            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)',
                          }}
                          title="Relancer via WhatsApp"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {paginated.length === 0 && (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(45,106,79,0.08)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#6C757D]">Aucun patient trouve</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Essayez de modifier vos filtres</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mt-5"
        >
          <p className="text-sm text-[#6C757D] font-medium">
            <span className="font-bold text-[#1A1A2E]">{filtered.length}</span> patient{filtered.length > 1 ? 's' : ''}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {getPageNumbers().map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(page)}
                className="w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background:
                    currentPage === page
                      ? 'linear-gradient(135deg, #2D6A4F, #40916C)'
                      : 'rgba(255,255,255,0.8)',
                  color: currentPage === page ? '#fff' : '#6C757D',
                  border: currentPage === page ? 'none' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow:
                    currentPage === page
                      ? '0 2px 8px rgba(45, 106, 79, 0.25)'
                      : 'none',
                }}
              >
                {page}
              </motion.button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
