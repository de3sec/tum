import { NextRequest, NextResponse } from 'next/server'
import dbConnect, { AnalyticsEvent, Website, Session } from '@/lib/mongodb'
import { createServerClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

    // Get analytics data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const [analyticsData, sessionData, clickData] = await Promise.all([
      getAnalyticsOverview(websiteId, thirtyDaysAgo),
      getSessionInsights(websiteId, thirtyDaysAgo),
      getClickInsights(websiteId, thirtyDaysAgo)
    ])

    // Generate insights using Gemini
    const insights = await generateInsights(analyticsData, sessionData, clickData, website)
    
    return NextResponse.json({ insights })

  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getAnalyticsOverview(websiteId: string, startDate: Date) {
  const [totalPageViews, uniqueVisitors, avgSessionDuration, bounceRate, topPages, deviceStats] = await Promise.all([
    AnalyticsEvent.countDocuments({
      websiteId,
      eventType: 'pageview',
      timestamp: { $gte: startDate }
    }),
    
    AnalyticsEvent.distinct('sessionId', {
      websiteId,
      timestamp: { $gte: startDate }
    }),
    
    Session.aggregate([
      {
        $match: {
          websiteId,
          startTime: { $gte: startDate },
          duration: { $exists: true, $gt: 0 }
        }
      },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]),
    
    Session.aggregate([
      {
        $match: {
          websiteId,
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bouncedSessions: { $sum: { $cond: [{ $lte: ['$pageViews', 1] }, 1, 0] } }
        }
      }
    ]),
    
    AnalyticsEvent.aggregate([
      {
        $match: {
          websiteId,
          eventType: 'pageview',
          timestamp: { $gte: startDate }
        }
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
      {
        $match: {
          websiteId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$eventData.deviceType',
          count: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          deviceType: '$_id',
          events: '$count',
          sessions: { $size: '$sessions' }
        }
      }
    ])
  ])

  return {
    totalPageViews,
    uniqueVisitors: uniqueVisitors.length,
    avgSessionDuration: avgSessionDuration[0]?.avgDuration || 0,
    bounceRate: bounceRate[0] ? bounceRate[0].bouncedSessions / bounceRate[0].totalSessions : 0,
    topPages,
    deviceStats
  }
}

async function getSessionInsights(websiteId: string, startDate: Date) {
  return await Session.aggregate([
    {
      $match: {
        websiteId,
        startTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$startTime' },
          dayOfWeek: { $dayOfWeek: '$startTime' }
        },
        sessions: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' }
      }
    },
    { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
  ])
}

async function getClickInsights(websiteId: string, startDate: Date) {
  return await AnalyticsEvent.aggregate([
    {
      $match: {
        websiteId,
        eventType: 'click',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          element: '$eventData.element',
          url: '$eventData.url'
        },
        clicks: { $sum: 1 },
        uniqueClickers: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        element: '$_id.element',
        url: '$_id.url',
        clicks: 1,
        uniqueClickers: { $size: '$uniqueClickers' }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 20 }
  ])
}

async function generateInsights(analyticsData: any, sessionData: any, clickData: any, website: any) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `
As a web analytics expert, analyze the following data for the website "${website.name}" (${website.domain}) and provide actionable insights and recommendations.

ANALYTICS OVERVIEW:
- Total Page Views: ${analyticsData.totalPageViews}
- Unique Visitors: ${analyticsData.uniqueVisitors}
- Average Session Duration: ${Math.round(analyticsData.avgSessionDuration / 1000)} seconds
- Bounce Rate: ${(analyticsData.bounceRate * 100).toFixed(1)}%

TOP PAGES:
${analyticsData.topPages.map((page: any) => `- ${page.url}: ${page.views} views (${page.uniqueViews} unique)`).join('\n')}

DEVICE BREAKDOWN:
${analyticsData.deviceStats.map((device: any) => `- ${device.deviceType}: ${device.sessions} sessions, ${device.events} events`).join('\n')}

SESSION PATTERNS:
${sessionData.slice(0, 10).map((session: any) => `- Day ${session._id.dayOfWeek}, Hour ${session._id.hour}: ${session.sessions} sessions, ${Math.round(session.avgDuration / 1000)}s avg duration`).join('\n')}

TOP CLICKED ELEMENTS:
${clickData.slice(0, 10).map((click: any) => `- ${click.element} on ${click.url}: ${click.clicks} clicks (${click.uniqueClickers} unique users)`).join('\n')}

Please provide:
1. **Key Performance Insights**: What the data tells us about user behavior
2. **Optimization Opportunities**: Specific areas for improvement
3. **Content Strategy**: Recommendations based on popular pages and user flow
4. **Technical Recommendations**: Device optimization and performance suggestions
5. **Conversion Optimization**: Ways to reduce bounce rate and increase engagement

Format your response as JSON with the following structure:
{
  "summary": "Brief overall assessment",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendations": [
    {
      "category": "Performance|Content|Technical|UX",
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "priority": "High|Medium|Low",
      "expectedImpact": "Description of expected impact"
    }
  ],
  "metrics": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["area1", "area2"]
  }
}
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    } else {
      // Fallback if JSON parsing fails
      return {
        summary: text.substring(0, 200) + '...',
        keyInsights: ['AI analysis completed successfully'],
        recommendations: [{
          category: 'General',
          title: 'Review Full Analysis',
          description: text,
          priority: 'Medium',
          expectedImpact: 'Comprehensive understanding of website performance'
        }],
        metrics: {
          strengths: ['Data collection is active'],
          improvements: ['Continue monitoring for more insights']
        }
      }
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    
    // Fallback insights based on data analysis
    return generateFallbackInsights(analyticsData, sessionData, clickData)
  }
}

function generateFallbackInsights(analyticsData: any, sessionData: any, clickData: any) {
  const recommendations = []
  
  // Bounce rate analysis
  if (analyticsData.bounceRate > 0.7) {
    recommendations.push({
      category: 'UX',
      title: 'Reduce High Bounce Rate',
      description: `Your bounce rate is ${(analyticsData.bounceRate * 100).toFixed(1)}%, which is above the recommended 40-60%. Focus on improving page load speed, content relevance, and user experience.`,
      priority: 'High',
      expectedImpact: 'Could increase engagement by 20-30%'
    })
  }
  
  // Session duration analysis
  if (analyticsData.avgSessionDuration < 30000) {
    recommendations.push({
      category: 'Content',
      title: 'Improve Content Engagement',
      description: 'Average session duration is low. Consider adding more engaging content, internal links, and clear calls-to-action.',
      priority: 'Medium',
      expectedImpact: 'Longer sessions typically correlate with higher conversion rates'
    })
  }
  
  // Device optimization
  const mobileTraffic = analyticsData.deviceStats.find((d: any) => d.deviceType === 'mobile')
  if (mobileTraffic && mobileTraffic.sessions > analyticsData.uniqueVisitors * 0.5) {
    recommendations.push({
      category: 'Technical',
      title: 'Optimize for Mobile',
      description: 'Mobile traffic represents a significant portion of your visitors. Ensure mobile optimization is prioritized.',
      priority: 'High',
      expectedImpact: 'Better mobile experience can improve engagement and conversions'
    })
  }

  return {
    summary: `Analysis of ${analyticsData.totalPageViews} page views from ${analyticsData.uniqueVisitors} visitors shows areas for optimization.`,
    keyInsights: [
      `Bounce rate is ${(analyticsData.bounceRate * 100).toFixed(1)}%`,
      `Average session duration is ${Math.round(analyticsData.avgSessionDuration / 1000)} seconds`,
      `Top page: ${analyticsData.topPages[0]?.url || 'No data'}`
    ],
    recommendations,
    metrics: {
      strengths: ['Active data collection', 'User engagement tracking'],
      improvements: ['Reduce bounce rate', 'Increase session duration']
    }
  }
} 