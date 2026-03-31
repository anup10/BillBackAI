'use client'

import { CaseData } from '@/lib/types'

interface TopbarProps { caseData: CaseData; onFileDispute: () => void }
export default function Topbar({ caseData, onFileDispute }: TopbarProps) {
  return (
    <header className="bg-white border-b border-[#DDE6EF] px-4 md:px-6 py-3 flex items-center gap-2 md:gap-3 sticky top-0 z-10">
      <div className="hidden sm:flex text-xs text-[#6B82A0] items-center gap-1.5">
        Home <span className="text-[#6B82A0]/50">›</span> <span className="text-[#0F1F3D] font-semibold">Dashboard</span>
      </div>
      <div className="flex-1" />
      <div className="bg-[#0ABFBC]/10 text-[#07908E] border border-[#0ABFBC]/25 text-xs font-semibold font-mono px-2 md:px-3 py-1.5 rounded-md truncate max-w-[120px] md:max-w-none">
        #{caseData.caseId}
      </div>
      <div className="hidden sm:block bg-[#F0F4F8] border border-[#DDE6EF] text-xs text-[#6B82A0] font-medium px-3 py-1.5 rounded-md">
        Q1 2024
      </div>
      <button
        onClick={onFileDispute}
        className="bg-[#0ABFBC] text-[#0F1F3D] text-xs font-bold px-3 md:px-4 py-1.5 rounded-lg hover:bg-[#07908E] transition-colors whitespace-nowrap"
      >
        + Dispute
      </button>
    </header>
  )
}
