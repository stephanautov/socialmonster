import { NextRequest, NextResponse } from 'next/server'
import { contentSchedulerService } from '@/lib/services/content-scheduler.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await contentSchedulerService.scheduleContent(
      body.userId,
      body.content,
      body.platforms,
      new Date(body.scheduledAt),
      {
        mediaUrls: body.mediaUrls,
        hashtags: body.hashtags,
        connectionIds: body.connectionIds
      }
    )

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Content scheduling failed',
        details: [],
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId || !startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'userId, startDate, and endDate are required',
          details: [],
          timestamp: new Date().toISOString()
        }
      }, { status: 400 })
    }

    const result = await contentSchedulerService.getContentCalendar(
      userId,
      new Date(startDate),
      new Date(endDate)
    )

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Calendar fetch failed',
        details: [],
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}