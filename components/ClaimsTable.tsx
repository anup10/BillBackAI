'use client'

import { CaseData, Claim, ErrorClass } from '@/lib/types'
import { computeWeightedRPS } from '@/lib/rps'

interface Props { caseData: CaseData; onDispute: (claimId: string) => void }

const ERROR_STYLES: Record<ErrorClass, string> = {
  upcoding:       'bg-[#FDE8E8] text-[#E53935]',
  duplicate:      'bg-[#FDE8E8] text-[#E53935]',
  unbundling:     'bg-[#FEF3DC] text-[#8B5E00]',
  'fee-schedule': 'bg-[#E8F4FE] text-[#1A6EA8]',
  none:           'bg-[#E8FAF5] text-[#00BFA5]',
}

const RPS_STYLES: Record<string, string> = {
  high: 'bg-[#00BFA5]/10 text-[#00BFA5]',
  med:  'bg-[#F5C242]/15 text-[#8B6000]',
  low:  'bg-[#E53935]/10 text-[#E53935]',
}

function ErrorBadge({ error, errorClass }: { error: string; errorClass: ErrorClass }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${ERROR_STYLES[errorClass]}`}>
      {error}
    </span>
  )
}

function RPSBadge({ rps, rpsClass }: { rps: number | null; rpsClass: string | null }) {
  if (!rps || !rpsClass) return <span className="text-[#6B82A0] text-xs">—</span>
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full font-mono ${RPS_STYLES[rpsClass]}`}>
      {rps}%
    </span>
  )
}

export default function ClaimsTable({ caseData, onDispute }: Props) {
  const flagged = caseData.claims.filter(c => c.overcharge > 0)
  const totalOvercharge = caseData.claims.reduce((s, c) => s + c.overcharge, 0)
  const weightedRPS = computeWeightedRPS(caseData.claims)

  return (
    <div className="bg-white border border-[#DDE6EF] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#DDE6EF] flex items-center gap-3">
        <h3 className="text-sm font-bold text-[#0F1F3D]">
          Flagged Overcharges: Case #{caseData.caseId}
        </h3>
        <span className="bg-[#0ABFBC]/10 text-[#07908E] text-[11px] font-bold px-2 py-0.5 rounded-md">
          {flagged.length} Active
        </span>
        <span className="ml-auto text-xs text-[#6B82A0]">All Error Types</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#DDE6EF]">
              {['CPT Code', 'Error Type', 'Provider', 'Date', 'Billed', 'Allowable', 'Overcharge', 'RPS', ''].map(h => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wide text-[#6B82A0] font-semibold px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {caseData.claims.map((claim) => (
              <tr key={claim.id} className="border-b border-[#F0F4F8] hover:bg-[#FAFCFF] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-mono text-sm font-bold text-[#0F1F3D]">{claim.cpt}</div>
                  <div className="text-[11px] text-[#6B82A0] mt-0.5 max-w-[140px] truncate">{claim.desc}</div>
                </td>
                <td className="px-4 py-3">
                  <ErrorBadge error={claim.error} errorClass={claim.errorClass} />
                  {claim.overcharge > 0 && (
                    <div className="text-[10px] text-[#6B82A0] mt-1 max-w-[160px] leading-snug">{claim.details.slice(0, 60)}...</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[#0F1F3D]">{claim.provider}</td>
                <td className="px-4 py-3 text-xs text-[#6B82A0] whitespace-nowrap">{claim.date}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#0F1F3D]">${claim.billed.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#6B82A0]">${claim.allowable.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {claim.overcharge > 0
                    ? <span className="font-mono text-sm font-bold text-[#E53935]">${claim.overcharge.toLocaleString()}</span>
                    : <span className="font-mono text-xs text-[#6B82A0]">$0</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <RPSBadge rps={claim.rps} rpsClass={claim.rpsClass} />
                </td>
                <td className="px-4 py-3">
                  {claim.letterContext && (
                    <button
                      onClick={() => onDispute(claim.id)}
                      className="bg-[#0ABFBC]/10 text-[#07908E] border border-[#0ABFBC]/25 text-[11px] font-bold px-2.5 py-1 rounded-md hover:bg-[#0ABFBC]/20 transition-colors whitespace-nowrap"
                    >
                      Dispute →
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {/* Total row */}
            {totalOvercharge > 0 && (
              <tr className="bg-[#F0F7FF] border-t-2 border-[#DDE6EF]">
                <td colSpan={5} className="px-4 py-3 text-right text-xs font-bold text-[#1A2D5A] uppercase tracking-wide">
                  Total Overcharge
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3">
                  <span className="font-mono text-base font-bold text-[#E53935]">${totalOvercharge.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-[#F5C242]/15 text-[#8B6000] text-xs font-bold font-mono px-2.5 py-1 rounded-full">
                    {weightedRPS}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDispute(caseData.claims.find(c => c.letterContext)?.id ?? '')}
                    className="bg-[#0ABFBC] text-[#0F1F3D] text-[11px] font-bold px-3 py-1 rounded-md hover:bg-[#07908E] transition-colors"
                  >
                    All →
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
