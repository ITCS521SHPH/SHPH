import { NextRequest, NextResponse } from 'next/server'
import { supabaseApi } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const from = searchParams.get('from')

    const result = await supabaseApi.getReviewQueue(status, from)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get review queue error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get review queue' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, comment } = body

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      )
    }

    let result
    if (action === 'approve') {
      result = await supabaseApi.approveReview(id)
    } else if (action === 'request_changes') {
      result = await supabaseApi.requestChangesReview(id, comment)
    } else if (action === 'in_review') {
      result = await supabaseApi.markReviewInProgress(id)
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Review action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process review action' },
      { status: 500 }
    )
  }
}
