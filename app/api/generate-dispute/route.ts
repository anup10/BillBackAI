import { NextRequest, NextResponse } from 'next/server'
import { generateDisputeLetter } from '@/lib/claude'
import { Claim, CaseData } from '@/lib/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { claims, caseData }: { claims: Claim[]; caseData: CaseData } = body

    if (!claims?.length || !caseData) {
      return NextResponse.json({ success: false, error: 'Missing claims or case data' }, { status: 400 })
    }

    const letterData = await generateDisputeLetter(claims, caseData)
    return NextResponse.json({ success: true, letterData })

  } catch (err) {
    console.error('Dispute letter error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate letter'
    }, { status: 500 })
  }
}
