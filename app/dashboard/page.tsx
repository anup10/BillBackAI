'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaseData } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import KPICards from '@/components/KPICards'
import ClaimsTable from '@/components/ClaimsTable'
import RPSPanel from '@/components/RPSPanel'
import ActivityFeed from '@/components/ActivityFeed'

export default function DashboardPage() {
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('billback_case')
    if (!stored) { router.push('/'); return }
    try {
      setCaseData(JSON.parse(stored))
      setReady(true)
    } catch {
      router.push('/')
    }
  }, [router])

  const openDispute = (claimId: string) => {
    sessionStorage.setItem('billback_dispute_claim', claimId)
    router.push('/dispute')
  }

  if (!ready || !caseData) {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#0ABFBC]/30 border-t-[#0ABFBC] rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <Sidebar caseData={caseData} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar caseData={caseData} onFileDispute={() => router.push('/dispute')} />
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          <KPICards caseData={caseData} />
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 mt-5">
            <div className="flex flex-col gap-5">
              <ClaimsTable caseData={caseData} onDispute={openDispute} />
              <ActivityFeed caseData={caseData} />
            </div>
            <RPSPanel caseData={caseData} onGenerateDisputes={() => router.push('/dispute')} />
          </div>
        </main>
      </div>
    </div>
  )
}
