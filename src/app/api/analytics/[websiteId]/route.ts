import { NextRequest, NextResponse } from 'next/server'
import dbConnect, { AnalyticsEvent, Website, Session } from '@/lib/mongodb'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  const { websiteId } = await params
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    await dbConnect()
    
    // Verify website ownership
    const website = await Website.findOne({ id: websiteId, userId: user.id })
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const eventType = searchParams.get('eventType')
    
    // Build query
    const query: any = {
      websiteId: websiteId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    if (eventType) {
      query.eventType = eventType
    }

    // Get analytics data based on request type
    const type = searchParams.get('type') || 'overview'
    
    switch (type) {
      case 'overview':
        return NextResponse.json(await getOverviewData(websiteId, startDate, endDate))
      
      case 'pageviews':
        return NextResponse.json(await getPageViewsData(websiteId, startDate, endDate))
      
      case 'clicks':
        return NextResponse.json(await getClicksData(websiteId, startDate, endDate))
      
      case 'devices':
        return NextResponse.json(await getDeviceData(websiteId, startDate, endDate))
      
      case 'heatmap':
        return NextResponse.json(await getHeatmapData(websiteId, startDate, endDate))
      
      case 'realtime':
        return NextResponse.json(await getRealtimeData(websiteId))
      
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getOverviewData(websiteId: string, startDate: string, endDate: string) {
  const dateFilter = {
    websiteId,
    timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }

  const [
    totalPageViews,
    uniqueVisitors,
    totalSessions,
    avgSessionDuration,
    bounceRate,
    topPages,
    deviceBreakdown,
    dailyStats
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({ ...dateFilter, eventType: 'pageview' }),
    
    AnalyticsEvent.distinct('sessionId', dateFilter),
    
    Session.countDocuments({
      websiteId,
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }),
    
    Session.aggregate([
      {
        $match: {
          websiteId,
          startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
          duration: { $exists: true, $gt: 0 }
        }
      },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]),
    
    Session.aggregate([
      {
        $match: {
          websiteId,
          startTime: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bouncedSessions: { $sum: { $cond: [{ $lte: ['$pageViews', 1] }, 1, 0] } }
        }
      },
      {
        $project: {
          bounceRate: { $divide: ['$bouncedSessions', '$totalSessions'] }
        }
      }
    ]),
    
    AnalyticsEvent.aggregate([
      {
        $match: { ...dateFilter, eventType: 'pageview' }
      },
      {
        $group: {
          _id: '$eventData.url',
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          url: '$_id',
          views: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]),
    
    AnalyticsEvent.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$eventData.deviceType',
          count: { $sum: 1 }
        }
      }
    ]),
    
    AnalyticsEvent.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          pageViews: { $sum: { $cond: [{ $eq: ['$eventType', 'pageview'] }, 1, 0] } },
          sessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          pageViews: 1,
          sessions: { $size: '$sessions' }
        }
      },
      { $sort: { date: 1 } }
    ])
  ])

  return {
    overview: {
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      totalSessions,
      avgSessionDuration: avgSessionDuration[0]?.avgDuration || 0,
      bounceRate: bounceRate[0]?.bounceRate || 0
    },
    topPages,
    deviceBreakdown,
    dailyStats
  }
}

async function getPageViewsData(websiteId: string, startDate: string, endDate: string) {
  return await AnalyticsEvent.aggregate([
    {
      $match: {
        websiteId,
        eventType: 'pageview',
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: {
          url: '$eventData.url',
          hour: { $dateToString: { format: '%Y-%m-%d-%H', date: '$timestamp' } }
        },
        views: { $sum: 1 },
        uniqueViews: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        url: '$_id.url',
        hour: '$_id.hour',
        views: 1,
        uniqueViews: { $size: '$uniqueViews' }
      }
    },
    { $sort: { hour: 1 } }
  ])
}

async function getClicksData(websiteId: string, startDate: string, endDate: string) {
  return await AnalyticsEvent.find({
    websiteId,
    eventType: 'click',
    timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).select('eventData.x eventData.y eventData.element eventData.elementText timestamp eventData.url')
}

async function getDeviceData(websiteId: string, startDate: string, endDate: string) {
  return await AnalyticsEvent.aggregate([
    {
      $match: {
        websiteId,
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: {
          deviceType: '$eventData.deviceType',
          browserName: '$eventData.browserName',
          os: '$eventData.os'
        },
        sessions: { $addToSet: '$sessionId' },
        events: { $sum: 1 }
      }
    },
    {
      $project: {
        deviceType: '$_id.deviceType',
        browserName: '$_id.browserName',
        os: '$_id.os',
        sessions: { $size: '$sessions' },
        events: 1
      }
    },
    { $sort: { sessions: -1 } }
  ])
}

async function getHeatmapData(websiteId: string, startDate: string, endDate: string) {
  const url = new URL('http://dummy.com')
  const targetUrl = url.searchParams.get('url')
  
  const query: any = {
    websiteId,
    eventType: 'click',
    timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }
  
  if (targetUrl) {
    query['eventData.url'] = targetUrl
  }

  return await AnalyticsEvent.find(query)
    .select('eventData.x eventData.y eventData.element eventData.url timestamp')
    .sort({ timestamp: -1 })
    .limit(10000) // Limit for performance
}

async function getRealtimeData(websiteId: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  
  const [activeUsers, recentEvents, topPages] = await Promise.all([
    AnalyticsEvent.distinct('sessionId', {
      websiteId,
      timestamp: { $gte: fiveMinutesAgo }
    }),
    
    AnalyticsEvent.find({
      websiteId,
      timestamp: { $gte: fiveMinutesAgo }
    }).sort({ timestamp: -1 }).limit(50),
    
    AnalyticsEvent.aggregate([
      {
        $match: {
          websiteId,
          eventType: 'pageview',
          timestamp: { $gte: fiveMinutesAgo }
        }
      },
      {
        $group: {
          _id: '$eventData.url',
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ])
  ])

  return {
    activeUsers: activeUsers.length,
    recentEvents,
    topPages
  }
} 