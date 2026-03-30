'use client'

import { useEffect, useRef, useState } from 'react'
import { CaseData } from '@/lib/types'
import { computeWeightedRPS } from '@/lib/rps'

interface Props { caseData: CaseData }

function useCountUp(target: number, duration = 1200, prefix = '', suffix = '') {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * ease))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  if (prefix === '$') return `$${value.toLocaleString()}${suffix}`
  return `${prefix}${value.toLocaleString()}${suffix}`
}

function KPICard({ label, value, meta, accent, delay = 0 }: {
  label: string; value: string; meta: React.ReactNode; accent: string; delay?: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])

  return (
    <div className={`bg-white border border-[#DDE6EF] rounded-xl p-4 relative overflow-hidden transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
      <div className="text-[10px] uppercase tracking-[1px] text-[#6B82A0] font-semibold mb-2">{label}</div>
      <div className="font-display text-3xl font-bold text-[#0F1F3D] leading-none mb-1.5">{value}</div>
      <div className="text-xs text-[#6B82A0]">{meta}</div>
    </div>
  )
}

export default function KPICards({ caseData }: Props) {
  const totalOvercharge = caseData.claims.reduce((s, c) => s + c.overcharge, 0)
  const recovered    = useCountUp(caseData.totalRecovered, 1200, '$')
  const flagged      = useCountUp(caseData.totalFlagged, 800)
  const overcharge   = useCountUp(totalOvercharge, 1000, '$')
  const disputes     = useCountUp(caseData.activeDisputes, 600)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        label="Total Recovered"
        value={recovered}
        meta={<span className="text-[#00BFA5] font-semibold">↑ 18% vs last qtr</span>}
        accent="bg-[#0ABFBC]"
        delay={0}
      />
      <KPICard
        label="Claims Flagged"
        value={flagged}
        meta={`of ${caseData.totalAudited.toLocaleString()} total audited`}
        accent="bg-[#1A6EA8]"
        delay={60}
      />
      <KPICard
        label="Total Overcharge"
        value={overcharge}
        meta={<span className="text-[#F5C242] font-semibold">Pending Dispute</span>}
        accent="bg-[#F5C242]"
        delay={120}
      />
      <KPICard
        label="Active Disputes"
        value={disputes}
        meta={<span className="text-[#E53935] font-semibold">{caseData.activeDisputes} open</span>}
        accent="bg-[#E53935]"
        delay={180}
      />
    </div>
  )
}
