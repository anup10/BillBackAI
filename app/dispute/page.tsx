'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CaseData, Claim, DisputeLetterData } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Copy, Download, Loader2, CheckSquare, Square, ChevronDown, ChevronRight, PlusCircle } from 'lucide-react'

const ERROR_STYLES: Record<string, string> = {
  upcoding:       'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/20',
  duplicate:      'bg-[#FDE8E8] text-[#E53935] border-[#E53935]/20',
  unbundling:     'bg-[#FEF3DC] text-[#8B5E00] border-[#F5C242]/30',
  'fee-schedule': 'bg-[#E8F4FE] text-[#1A6EA8] border-[#1A6EA8]/20',
  none:           'bg-[#E8FAF5] text-[#00BFA5] border-[#00BFA5]/20',
}

function letterToPlainText(d: DisputeLetterData): string {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return [
    today, '',
    d.recipientBlock, '',
    d.subject, '',
    d.salutation, '',
    ...d.paragraphs.flatMap(p => [p, '']),
    d.signature, '',
    d.cc,
  ].join('\n')
}

function BillBackStamp() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="border-2 border-[#0ABFBC] rounded-md px-3 py-1.5 flex flex-col items-center gap-0.5 opacity-80">
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#0ABFBC]">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[#0ABFBC] font-black text-[11px] tracking-[2px] uppercase">BillBack</span>
        </div>
        <span className="text-[#0ABFBC]/70 text-[7px] tracking-[2.5px] uppercase font-semibold">AI Verified</span>
      </div>
    </div>
  )
}

function DisputeLetter({ data }: { data: DisputeLetterData }) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-sm max-w-2xl mx-auto px-14 py-12 relative font-serif text-[#1a1a2e]">
      <div className="absolute top-10 right-10"><BillBackStamp /></div>
      <p className="text-sm mb-8">{today}</p>
      <div className="text-sm mb-8 whitespace-pre-line leading-relaxed">{data.recipientBlock}</div>
      <p className="text-sm font-bold mb-6 underline underline-offset-2">{data.subject}</p>
      <p className="text-sm mb-5">{data.salutation}</p>
      <div className="space-y-4">
        {data.paragraphs.map((para, i) => (
          <p key={i} className="text-sm leading-[1.75] text-justify">{para}</p>
        ))}
      </div>
      <div className="mt-10 text-sm whitespace-pre-line leading-relaxed">{data.signature}</div>
      <div className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-400 leading-relaxed">{data.cc}</div>
    </div>
  )
}

// ── Checkbox shared between both claim types ──────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
      checked ? 'bg-[#0ABFBC] border-[#0ABFBC]' : 'border-[#C4D0DC] bg-white'
    }`}>
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

export default function DisputePage() {
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseData | null>(null)

  // IDs of selected claims (both AI-flagged and manual)
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set())
  // User-written reasons for manually added (non-flagged) claims
  const [customReasons, setCustomReasons] = useState<Record<string, string>>({})

  const [hoveredClaimId, setHoveredClaimId] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  const [letterData, setLetterData] = useState<DisputeLetterData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('billback_case')
    if (!stored) { router.push('/'); return }
    const data: CaseData = JSON.parse(stored)
    setCaseData(data)
    const flagged = data.claims.filter(c => c.overcharge > 0 && c.letterContext)
    setSelectedClaims(new Set(flagged.map(c => c.id)))
  }, [router])

  const showLetter = useCallback((data: DisputeLetterData) => {
    setLetterData(data)
    setVisible(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }, [])

  const toggleClaim = (id: string) => {
    setSelectedClaims(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // clear custom reason when deselected
        setCustomReasons(r => { const n = { ...r }; delete n[id]; return n })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = (claims: Claim[]) => {
    const ids = claims.map(c => c.id)
    const allChecked = ids.every(id => selectedClaims.has(id))
    setSelectedClaims(prev => {
      const next = new Set(prev)
      if (allChecked) {
        ids.forEach(id => next.delete(id))
      } else {
        ids.forEach(id => next.add(id))
      }
      return next
    })
  }

  // Validate: every manually-selected claim must have a non-empty reason
  const missingReasons = caseData
    ? caseData.claims
        .filter(c => !(c.overcharge > 0 && c.letterContext))   // manual claims only
        .filter(c => selectedClaims.has(c.id))
        .filter(c => !customReasons[c.id]?.trim())
    : []

  const canGenerate = selectedClaims.size > 0 && missingReasons.length === 0

  const generateLetter = async () => {
    if (!caseData || !canGenerate) return

    // Merge user reasons into claim objects before sending
    const claims = caseData.claims
      .filter(c => selectedClaims.has(c.id))
      .map(c => customReasons[c.id]
        ? { ...c, details: customReasons[c.id].trim() }
        : c
      )

    setLetterData(null)
    setLoading(true)
    try {
      const r = await fetch('/api/generate-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claims, caseData })
      })
      const { success, letterData: ld, error } = await r.json()
      setLoading(false)
      if (success && ld) showLetter(ld)
      else console.error('Letter generation failed:', error)
    } catch (err: unknown) {
      setLoading(false)
      console.error('Failed to generate letter:', err)
    }
  }

  const copyLetter = () => {
    if (!letterData) return
    navigator.clipboard.writeText(letterToPlainText(letterData))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadLetter = () => {
    if (!letterData || !caseData) return
    const blob = new Blob([letterToPlainText(letterData)], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `BillBack_Dispute_${caseData.caseId}.txt`
    a.click()
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0ABFBC] animate-spin" />
      </div>
    )
  }

  const flaggedClaims  = caseData.claims.filter(c => c.overcharge > 0 && c.letterContext)
  const manualClaims   = caseData.claims.filter(c => !(c.overcharge > 0 && c.letterContext))
  const allFlaggedSelected = flaggedClaims.length > 0 && flaggedClaims.every(c => selectedClaims.has(c.id))

  const totalDisputed = flaggedClaims.filter(c => selectedClaims.has(c.id)).reduce((s, c) => s + c.overcharge, 0)
  const manualSelected = manualClaims.filter(c => selectedClaims.has(c.id)).length

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <Sidebar caseData={caseData} />
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white border-b border-[#DDE6EF] px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-[#F0F4F8] border border-[#DDE6EF] text-[#0F1F3D] text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#E5EEF7] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <div className="text-sm font-bold text-[#0F1F3D]">Dispute Letter Generator</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={copyLetter} disabled={!letterData}
              className="flex items-center gap-2 border border-[#DDE6EF] bg-white text-[#0F1F3D] text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#F0F4F8] disabled:opacity-40 transition-colors">
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={downloadLetter} disabled={!letterData}
              className="flex items-center gap-2 bg-[#0ABFBC] text-[#0F1F3D] text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-[#07908E] disabled:opacity-40 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        </header>

        <main className="flex-1 flex gap-5 p-6 min-w-0">

          {/* LEFT: Claim Selector */}
          <div className="w-[310px] flex-shrink-0 flex flex-col gap-3">
            <div className="bg-white border border-[#DDE6EF] rounded-xl overflow-visible">

              {/* ── Section 1: AI Flagged ── */}
              <div className="px-4 py-3 border-b border-[#DDE6EF] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#0F1F3D] uppercase tracking-wide">AI Flagged</h3>
                  <p className="text-[11px] text-[#6B82A0] mt-0.5">
                    {flaggedClaims.filter(c => selectedClaims.has(c.id)).length} of {flaggedClaims.length} selected
                  </p>
                </div>
                <button onClick={() => toggleAll(flaggedClaims)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0ABFBC] hover:text-[#07908E] transition-colors">
                  {allFlaggedSelected
                    ? <><CheckSquare className="w-3.5 h-3.5" /> Deselect All</>
                    : <><Square className="w-3.5 h-3.5" /> Select All</>}
                </button>
              </div>

              <div className="p-3 space-y-2">
                {flaggedClaims.map(claim => {
                  const isChecked = selectedClaims.has(claim.id)
                  const isHovered = hoveredClaimId === claim.id
                  return (
                    <div key={claim.id} className="relative"
                      onMouseEnter={() => setHoveredClaimId(claim.id)}
                      onMouseLeave={() => setHoveredClaimId(null)}>
                      <button onClick={() => toggleClaim(claim.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isChecked
                            ? 'border-[#0ABFBC]/40 bg-[#0ABFBC]/[0.06]'
                            : 'border-[#DDE6EF] hover:border-[#0ABFBC]/30 hover:bg-[#F8FAFC]'
                        }`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isChecked} />
                            <span className="font-mono text-sm font-bold text-[#0F1F3D]">CPT {claim.cpt}</span>
                          </div>
                          {claim.rps && (
                            <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                              claim.rpsClass === 'high' ? 'bg-[#00BFA5]/10 text-[#00BFA5]' :
                              claim.rpsClass === 'med'  ? 'bg-[#F5C242]/15 text-[#8B6000]' :
                              'bg-[#E53935]/10 text-[#E53935]'
                            }`}>{claim.rps}% RPS</span>
                          )}
                        </div>
                        <div className="text-xs text-[#6B82A0] mb-2 leading-snug">{claim.desc}</div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wide ${ERROR_STYLES[claim.errorClass]}`}>
                            {claim.error}
                          </span>
                          <span className="font-mono text-sm font-bold text-[#E53935]">${claim.overcharge.toLocaleString()}</span>
                        </div>
                      </button>

                      {/* Hover tooltip */}
                      {isHovered && claim.details && (
                        <div className="absolute left-full ml-3 top-0 w-64 bg-[#0F1F3D] text-white text-xs p-3 rounded-xl z-50 shadow-xl pointer-events-none">
                          <div className="text-[10px] uppercase tracking-[1.5px] text-white/40 mb-1.5">Dispute Reason</div>
                          <p className="text-white/90 leading-relaxed">{claim.details}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ── Section 2: Add Other Claims ── */}
              {manualClaims.length > 0 && (
                <>
                  <div className="border-t border-[#DDE6EF]" />
                  <button
                    onClick={() => setShowManual(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-3.5 h-3.5 text-[#0ABFBC]" />
                      <span className="text-xs font-bold text-[#0F1F3D] uppercase tracking-wide">Add Other Claims</span>
                      {manualSelected > 0 && (
                        <span className="bg-[#0ABFBC] text-[#0F1F3D] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{manualSelected}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6B82A0]">
                      <span>{manualClaims.length} available</span>
                      {showManual
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {showManual && (
                    <div className="px-3 pb-3 space-y-2">
                      <p className="text-[11px] text-[#6B82A0] px-1 pb-1">
                        Select any line item and provide your reason — it will be included in the dispute letter.
                      </p>
                      {manualClaims.map(claim => {
                        const isChecked = selectedClaims.has(claim.id)
                        const reason = customReasons[claim.id] ?? ''
                        const isMissingReason = isChecked && !reason.trim()
                        return (
                          <div key={claim.id} className={`border rounded-xl overflow-hidden transition-all ${
                            isChecked
                              ? isMissingReason
                                ? 'border-[#F5C242]/60 bg-[#FEF3DC]/40'
                                : 'border-[#0ABFBC]/40 bg-[#0ABFBC]/[0.04]'
                              : 'border-[#DDE6EF] bg-white'
                          }`}>
                            {/* Claim row — click to toggle */}
                            <button
                              onClick={() => toggleClaim(claim.id)}
                              className="w-full text-left px-3 py-2.5 hover:bg-black/[0.02] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={isChecked} />
                                <span className="font-mono text-sm font-bold text-[#0F1F3D]">CPT {claim.cpt}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-[#F0F4F8] text-[#6B82A0] border-[#DDE6EF] uppercase tracking-wide ml-auto">
                                  {claim.billed ? `$${claim.billed.toLocaleString()}` : 'N/A'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#6B82A0] mt-1 leading-snug pl-6">{claim.desc}</p>
                            </button>

                            {/* Reason textarea — only when checked */}
                            {isChecked && (
                              <div className="px-3 pb-3" onClick={e => e.stopPropagation()}>
                                <label className="block text-[10px] uppercase tracking-[1.5px] text-[#6B82A0] mb-1.5">
                                  {isMissingReason
                                    ? <span className="text-[#F5C242]">Reason required to include this claim</span>
                                    : 'Your dispute reason'}
                                </label>
                                <textarea
                                  rows={2}
                                  value={reason}
                                  onChange={e => setCustomReasons(r => ({ ...r, [claim.id]: e.target.value }))}
                                  placeholder="e.g. This procedure was not performed during the visit. Requesting itemized records and supporting documentation."
                                  className={`w-full text-xs text-[#0F1F3D] border rounded-lg px-3 py-2 resize-none focus:outline-none leading-relaxed placeholder-[#6B82A0]/60 ${
                                    isMissingReason
                                      ? 'border-[#F5C242] bg-[#FFFBF0] focus:border-[#F5C242]'
                                      : 'border-[#DDE6EF] bg-white focus:border-[#0ABFBC]'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Summary + Generate */}
            {selectedClaims.size > 0 && (
              <div className="bg-[#0F1F3D] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-[1.5px] text-white/30 mb-2">Selected Summary</div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">AI Flagged</span>
                    <span className="text-white font-bold">{flaggedClaims.filter(c => selectedClaims.has(c.id)).length}</span>
                  </div>
                  {manualSelected > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Manually Added</span>
                      <span className="text-white font-bold">{manualSelected}</span>
                    </div>
                  )}
                  {totalDisputed > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Total Overcharge</span>
                      <span className="text-[#0ABFBC] font-mono font-bold">${totalDisputed.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {missingReasons.length > 0 && (
                  <p className="text-[11px] text-[#F5C242] mb-3 leading-snug">
                    {missingReasons.length} manually added claim{missingReasons.length > 1 ? 's are' : ' is'} missing a reason.
                  </p>
                )}

                <button
                  onClick={generateLetter}
                  disabled={loading || !canGenerate}
                  className="w-full bg-[#0ABFBC] text-[#0F1F3D] text-sm font-bold py-2.5 rounded-lg hover:bg-[#07908E] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    : `Generate Dispute Letter (${selectedClaims.size})`}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Letter */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-[#E8EEF4] border border-[#DDE6EF] rounded-xl flex-1 flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#DDE6EF] bg-white flex items-center gap-3">
                <h3 className="text-sm font-bold text-[#0F1F3D]">
                  {letterData
                    ? 'Dispute Letter'
                    : selectedClaims.size > 0
                      ? `${selectedClaims.size} claim${selectedClaims.size !== 1 ? 's' : ''} selected — click Generate to proceed`
                      : 'Select claims to generate a dispute letter'}
                </h3>
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-[#0ABFBC]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Billback is generating...
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-10 h-10 border-2 border-[#0ABFBC]/30 border-t-[#0ABFBC] rounded-full animate-spin" />
                    <p className="text-sm text-[#6B82A0]">Billback is drafting your dispute letter...</p>
                    <p className="text-xs text-[#6B82A0]/60">Citing CMS guidelines and NCCI coding rules</p>
                  </div>
                ) : letterData ? (
                  <div className="transition-opacity duration-500" style={{ opacity: visible ? 1 : 0 }}>
                    <DisputeLetter data={letterData} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#0ABFBC]/10 flex items-center justify-center mb-4">
                      <svg className="w-7 h-7 text-[#0ABFBC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#0F1F3D] mb-1">No letter generated yet</p>
                    <p className="text-xs text-[#6B82A0]">
                      {selectedClaims.size > 0
                        ? `${selectedClaims.size} claim${selectedClaims.size !== 1 ? 's' : ''} selected — click Generate Dispute Letter to proceed`
                        : 'Select flagged claims on the left, or add others manually'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
