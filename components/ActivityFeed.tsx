'use client'

import { CaseData } from '@/lib/types'

interface Props { caseData: CaseData }

const DOT_COLORS: Record<string, string> = {
  green: 'bg-[#00BFA5]',
  teal:  'bg-[#0ABFBC]',
  gold:  'bg-[#F5C242]',
  red:   'bg-[#E53935]',
}

export default function ActivityFeed({ caseData }: Props) {
  return (
    <div className="bg-white border border-[#DDE6EF] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#DDE6EF] flex items-center gap-3">
        <h3 className="text-sm font-bold text-[#0F1F3D]">Recent Activity</h3>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#00BFA5]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA5] animate-pulse-dot inline-block" />
          Live
        </div>
      </div>
      <div>
        {caseData.activity.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 px-5 py-3.5 text-sm ${
              i < caseData.activity.length - 1 ? 'border-b border-[#F0F4F8]' : ''
            }`}
          >
            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DOT_COLORS[item.type] ?? 'bg-[#6B82A0]'}`} />
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] text-[#0F1F3D] leading-snug"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
              <div className="text-[11px] text-[#6B82A0] mt-1">{item.ts}</div>
            </div>
            {item.amount && (
              <span className="text-xs font-bold font-mono text-[#00BFA5] flex-shrink-0">{item.amount}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
