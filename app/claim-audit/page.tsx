'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaseData, Claim } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, ChevronDown, ChevronRight, FileText, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

const ERROR_STYLES: Record<string, string> = {
  upcoding:       'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/20',
  duplicate:      'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/20',
  unbundling:     'bg-[#FEF3DC] text-[#8B5E00] border-[#F5C242]/30',
  'fee-schedule': 'bg-[#E8F4FE] text-[#1A6EA8] border-[#1A6EA8]/20',
  none:           'bg-[#E8FAF5] text-[#00BFA5] border-[#00BFA5]/20',
}

type Filter = 'all' | 'flagged' | 'clean'
type SortKey = 'overcharge' | 'rps' | 'billed' | 'cpt'

function RPSBar({ rps, rpsClass }: { rps: number; rpsClass: string | null }) {
  const color = rpsClass === 'high' ? '#00BFA5' : rpsClass === 'med' ? '#F5C242' : '#E53935'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-[#DDE6EF] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${rps}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold font-mono" style={{ color }}>{rps}%</span>
    </div>
  )
}

function ClaimRow({
  claim,
  onDispute,
}: {
  claim: Claim
  onDispute: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isFlagged = claim.overcharge > 0

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isFlagged ? 'border-[#DDE6EF] bg-white' : 'border-[#DDE6EF] bg-white opacity-70'
    }`}>
      {/* Main row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[#F8FAFC] transition-colors"
      >
        {/* Expand icon */}
        <div className="text-[#6B82A0] flex-shrink-0">
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0">
          {isFlagged
            ? <AlertTriangle className="w-4 h-4 text-[#E53935]" />
            : <CheckCircle className="w-4 h-4 text-[#00BFA5]" />
          }
        </div>

        {/* CPT + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-sm font-bold text-[#0F1F3D]">CPT {claim.cpt}</span>
            <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wide ${ERROR_STYLES[claim.errorClass]}`}>
              {claim.error}
            </span>
          </div>
          <p className="text-xs text-[#6B82A0] truncate">{claim.desc}</p>
        </div>

        {/* Amounts */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0 text-right">
          <div>
            <div className="text-[10px] text-[#6B82A0] uppercase tracking-wide">Billed</div>
            <div className="font-mono text-sm text-[#0F1F3D]">${claim.billed.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6B82A0] uppercase tracking-wide">Allowable</div>
            <div className="font-mono text-sm text-[#0F1F3D]">${claim.allowable.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6B82A0] uppercase tracking-wide">Disputed</div>
            <div className={`font-mono text-sm font-bold ${isFlagged ? 'text-[#E53935]' : 'text-[#00BFA5]'}`}>
              {isFlagged ? `$${claim.overcharge.toLocaleString()}` : '—'}
            </div>
          </div>
        </div>

        {/* RPS */}
        <div className="flex-shrink-0 w-32 text-right">
          {claim.rps !== null ? (
            <div className="flex flex-col items-end gap-1">
              <div className="text-[10px] text-[#6B82A0] uppercase tracking-wide">RPS</div>
              <RPSBar rps={claim.rps} rpsClass={claim.rpsClass} />
            </div>
          ) : (
            <span className="text-xs text-[#6B82A0]/50">—</span>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#DDE6EF] px-5 py-4 bg-[#F8FAFC]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Claim details */}
            <div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-[#6B82A0] mb-2">Claim Details</div>
              <div className="space-y-1.5">
                {[
                  ['Provider', claim.provider],
                  ['Date of Service', claim.date],
                  ['ICD-10', claim.icd10 ?? '—'],
                  ['Units', claim.units != null ? String(claim.units) : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-[#6B82A0]">{label}</span>
                    <span className="text-[#0F1F3D] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing breakdown */}
            <div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-[#6B82A0] mb-2">Billing Breakdown</div>
              <div className="space-y-1.5">
                {[
                  ['Amount Billed', `$${claim.billed.toLocaleString()}`],
                  ['Commercially Allowable', `$${claim.allowable.toLocaleString()}`],
                  ['Overcharge', isFlagged ? `$${claim.overcharge.toLocaleString()}` : '$0'],
                  ['Overcharge %', isFlagged ? `${Math.round((claim.overcharge / claim.billed) * 100)}%` : '0%'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-[#6B82A0]">{label}</span>
                    <span className={`font-mono font-medium ${label === 'Overcharge' && isFlagged ? 'text-[#E53935]' : 'text-[#0F1F3D]'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit finding */}
          {claim.details && (
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-[1.5px] text-[#6B82A0] mb-1.5">Audit Finding</div>
              <p className="text-xs text-[#0F1F3D] leading-relaxed bg-white border border-[#DDE6EF] rounded-lg px-3 py-2">{claim.details}</p>
            </div>
          )}

          {/* RPS rationale */}
          {claim.rationale && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-[#0ABFBC]" />
                <div className="text-[10px] uppercase tracking-[1.5px] text-[#6B82A0]">RPS Engine Rationale</div>
              </div>
              <p className="text-xs text-[#0F1F3D] leading-relaxed bg-white border border-[#DDE6EF] rounded-lg px-3 py-2">{claim.rationale}</p>
            </div>
          )}

          {/* Actions */}
          {isFlagged && (
            <div className="flex justify-end">
              <button
                onClick={() => onDispute(claim.id)}
                className="flex items-center gap-2 bg-[#0ABFBC] text-[#0F1F3D] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#07908E] transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> Generate Dispute Letter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ClaimAuditPage() {
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [filter, setFilter] = useState<Filter>('flagged')
  const [sortKey, setSortKey] = useState<SortKey>('overcharge')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('billback_case')
    if (!stored) { router.push('/'); return }
    setCaseData(JSON.parse(stored))
  }, [router])

  const openDispute = (claimId: string) => {
    sessionStorage.setItem('billback_dispute_claim', claimId)
    router.push('/dispute')
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0ABFBC]/30 border-t-[#0ABFBC] rounded-full animate-spin" />
      </div>
    )
  }

  const flaggedCount = caseData.claims.filter(c => c.overcharge > 0).length
  const cleanCount = caseData.claims.filter(c => c.overcharge === 0).length

  const filtered = caseData.claims
    .filter(c => {
      if (filter === 'flagged') return c.overcharge > 0
      if (filter === 'clean') return c.overcharge === 0
      return true
    })
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.cpt.includes(q) || c.desc.toLowerCase().includes(q) || c.error.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortKey === 'overcharge') return b.overcharge - a.overcharge
      if (sortKey === 'rps') return (b.rps ?? 0) - (a.rps ?? 0)
      if (sortKey === 'billed') return b.billed - a.billed
      if (sortKey === 'cpt') return a.cpt.localeCompare(b.cpt)
      return 0
    })

  const totalOvercharge = caseData.claims.filter(c => c.overcharge > 0).reduce((s, c) => s + c.overcharge, 0)

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <Sidebar caseData={caseData} />
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-[#DDE6EF] px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-[#F0F4F8] border border-[#DDE6EF] text-[#0F1F3D] text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#E5EEF7] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <div>
            <div className="text-sm font-bold text-[#0F1F3D]">Claim Audit</div>
            <div className="text-[11px] text-[#6B82A0]">{caseData.patientName} · {caseData.dateOfService} · {caseData.facility}</div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-[#6B82A0]">Total Flagged</div>
              <div className="font-mono text-sm font-bold text-[#E53935]">${totalOvercharge.toLocaleString()}</div>
            </div>
            <button
              onClick={() => router.push('/dispute')}
              className="flex items-center gap-2 bg-[#0ABFBC] text-[#0F1F3D] text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-[#07908E] transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> Dispute All
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">

          {/* Controls */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {/* Filter tabs */}
            <div className="flex bg-white border border-[#DDE6EF] rounded-lg p-1 gap-0.5">
              {([
                ['all',     `All (${caseData.claims.length})`],
                ['flagged', `Flagged (${flaggedCount})`],
                ['clean',   `Clean (${cleanCount})`],
              ] as [Filter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filter === key
                      ? 'bg-[#0ABFBC] text-[#0F1F3D]'
                      : 'text-[#6B82A0] hover:text-[#0F1F3D]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="bg-white border border-[#DDE6EF] text-xs text-[#0F1F3D] font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0ABFBC] cursor-pointer"
            >
              <option value="overcharge">Sort: Overcharge ↓</option>
              <option value="rps">Sort: RPS Score ↓</option>
              <option value="billed">Sort: Billed Amount ↓</option>
              <option value="cpt">Sort: CPT Code</option>
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search CPT, description, error…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] bg-white border border-[#DDE6EF] text-xs text-[#0F1F3D] px-3 py-2 rounded-lg focus:outline-none focus:border-[#0ABFBC] placeholder-[#6B82A0]"
            />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Claims',    value: String(caseData.claims.length),   sub: 'audited' },
              { label: 'Flagged',         value: String(flaggedCount),              sub: 'with errors', color: '#E53935' },
              { label: 'Total Overcharge',value: `$${totalOvercharge.toLocaleString()}`, sub: 'disputed',  color: '#E53935' },
              { label: 'Weighted RPS',    value: `${caseData.weightedRPS}%`,       sub: 'recovery probability',
                color: caseData.weightedRPS >= 75 ? '#00BFA5' : caseData.weightedRPS >= 45 ? '#F5C242' : '#E53935' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white border border-[#DDE6EF] rounded-xl px-4 py-3">
                <div className="text-[10px] uppercase tracking-wide text-[#6B82A0] mb-0.5">{label}</div>
                <div className="font-mono text-lg font-black" style={{ color: color ?? '#0F1F3D' }}>{value}</div>
                <div className="text-[10px] text-[#6B82A0]">{sub}</div>
              </div>
            ))}
          </div>

          {/* Claim list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-[#6B82A0] text-sm">No claims match your filter.</div>
            ) : (
              filtered.map(claim => (
                <ClaimRow key={claim.id} claim={claim} onDispute={openDispute} />
              ))
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
