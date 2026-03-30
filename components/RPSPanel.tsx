'use client'

import { useEffect, useRef, useState } from 'react'
import { CaseData } from '@/lib/types'
import { getRecommendation } from '@/lib/rps'

interface Props { caseData: CaseData; onGenerateDisputes: () => void }

function GaugeArc({ rps }: { rps: number }) {
  const [current, setCurrent] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const duration = 1500
    const start = performance.now()
    const total = 232
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setCurrent(Math.round(rps * ease))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [rps])

  const totalLen = 232
  const dashLen = (current / 100) * totalLen
  const angleRad = (-Math.PI) + (current / 100) * Math.PI
  const nx = 90 + 74 * Math.cos(angleRad)
  const ny = 90 + 74 * Math.sin(angleRad)

  const color = current >= 75 ? '#00BFA5' : current >= 45 ? '#F5C242' : '#E53935'

  return (
    <div className="text-center">
      <svg viewBox="0 0 180 100" className="w-44 h-24 mx-auto">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E53935" />
            <stop offset="50%" stopColor="#F5C242" />
            <stop offset="100%" stopColor="#00BFA5" />
          </linearGradient>
        </defs>
        <path d="M 16 90 A 74 74 0 0 1 164 90" fill="none" stroke="#EEF2F7" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M 16 90 A 74 74 0 0 1 164 90"
          fill="none" stroke="url(#g)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dashLen} ${totalLen - dashLen}`}
        />
        <circle cx={nx} cy={ny} r="5" fill="#0F1F3D" />
      </svg>
      <div className="font-display text-4xl font-bold mt-1" style={{ color }}>{current}%</div>
    </div>
  )
}

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 300)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div className="h-1.5 bg-[#DDE6EF] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-[1500ms] ease-out" style={{ width: `${width}%`, background: color }} />
    </div>
  )
}

export default function RPSPanel({ caseData, onGenerateDisputes }: Props) {
  const flagged = caseData.claims.filter(c => c.overcharge > 0)
  const rec = getRecommendation(caseData.claims, caseData.weightedRPS)

  const barColors = ['#00BFA5', '#0ABFBC', '#F5C242', '#1A6EA8']

  return (
    <div className="flex flex-col gap-4">
      {/* Gauge */}
      <div className="bg-white border border-[#DDE6EF] rounded-xl p-5">
        <div className="text-[10px] uppercase tracking-[1px] text-[#6B82A0] font-semibold mb-3 text-center">
          Weighted Case RPS Score
        </div>
        <GaugeArc rps={caseData.weightedRPS} />
        <p className="text-xs text-[#6B82A0] text-center mt-2">
          Weighted · {flagged.length} flagged claim{flagged.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Claim Breakdown */}
      {flagged.length > 0 && (
        <div className="bg-white border border-[#DDE6EF] rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[1px] text-[#6B82A0] font-semibold mb-3">
            Claim Breakdown
          </div>
          <div className="space-y-3">
            {flagged.map((c, i) => (
              <div key={c.id}>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs text-[#0F1F3D] font-medium">CPT {c.cpt} · {c.error}</div>
                  <div className="text-xs font-bold font-mono" style={{ color: barColors[i % barColors.length] }}>
                    {c.rps ?? 0}%
                  </div>
                </div>
                <AnimatedBar pct={c.rps ?? 0} color={barColors[i % barColors.length]} delay={i * 150} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Probability Details */}
      {flagged.length > 0 && (
        <div className="bg-white border border-[#DDE6EF] rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-[1px] text-[#6B82A0] font-semibold mb-3">
            Error Summary
          </div>
          <div className="space-y-2">
            {flagged.map(c => (
              <div key={c.id} className="p-2.5 bg-[#F8FAFC] rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#0F1F3D] font-mono">CPT {c.cpt}</span>
                  <span className="text-xs font-bold text-[#E53935] font-mono">${c.overcharge.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-[#6B82A0] leading-snug">{c.details.slice(0, 90)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Panel */}
      <div className="bg-gradient-to-br from-[#1A2D5A] to-[#0F1F3D] rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-[1.5px] text-white/30 mb-1.5">
          {rec.urgency === 'high' ? '⚡ Recommended Action' : '📋 Recommended Action'}
        </div>
        <div className="text-sm font-semibold text-white mb-1.5 leading-snug">{rec.title}</div>
        <div className="text-xs text-white/40 mb-3 leading-relaxed">{rec.desc}</div>
        <button
          onClick={onGenerateDisputes}
          className="w-full bg-[#0ABFBC] text-[#0F1F3D] text-sm font-bold py-2.5 rounded-lg hover:bg-[#07908E] transition-colors"
        >
          Generate Dispute Letters →
        </button>
      </div>
    </div>
  )
}
