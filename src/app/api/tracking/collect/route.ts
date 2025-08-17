import { NextRequest, NextResponse } from 'next/server'
import dbConnect, { AnalyticsEvent, Website, Session } from '@/lib/mongodb'
import { generateSessionId, detectDeviceType, parseBrowserInfo, parseOSInfo } from '@/lib/utils'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { trackingId, sessionId, eventType, eventData } = body
    
    if (!trackingId || !sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify tracking ID exists and website is active
    const website = await Website.findOne({ trackingId, isActive: true })
    if (!website) {
      return NextResponse.json(
        { error: 'Invalid tracking ID' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Apply sampling rate
    if (Math.random() > website.settings.samplingRate) {
      return NextResponse.json(
        { success: true, sampled: true },
        { status: 200, headers: corsHeaders }
      )
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Enhance event data with server-side information
    const enhancedEventData = {
      ...eventData,
      ip,
      serverTimestamp: new Date(),
      // Parse device info from user agent if not provided
      deviceType: eventData.deviceType || detectDeviceType(eventData.userAgent || ''),
      browserName: eventData.browserInfo?.name || parseBrowserInfo(eventData.userAgent || '').name,
      browserVersion: eventData.browserInfo?.version || parseBrowserInfo(eventData.userAgent || '').version,
      os: eventData.os || parseOSInfo(eventData.userAgent || ''),
    }

    // Create analytics event
    const analyticsEvent = new AnalyticsEvent({
      websiteId: website.id,
      sessionId,
      eventType,
      eventData: enhancedEventData,
      ip,
      timestamp: new Date(eventData.timestamp || Date.now())
    })

    await analyticsEvent.save()

    // Update or create session
    if (eventType === 'pageview') {
      await updateSession(website.id, sessionId, eventData, ip)
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Analytics collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

async function updateSession(websiteId: string, sessionId: string, eventData: any, ip: string) {
  try {
    const existingSession = await Session.findOne({ sessionId })
    
    if (existingSession) {
      // Update existing session
      existingSession.endTime = new Date()
      existingSession.duration = Date.now() - existingSession.startTime.getTime()
      existingSession.pageViews += 1
      existingSession.events += 1
      
      if (!existingSession.exitPage) {
        existingSession.exitPage = eventData.url
      }
      
      await existingSession.save()
    } else {
      // Create new session
      const newSession = new Session({
        sessionId,
        websiteId,
        startTime: new Date(),
        entryPage: eventData.url,
        pageViews: 1,
        events: 1,
        deviceInfo: {
          userAgent: eventData.userAgent,
          screenWidth: eventData.screenWidth,
          screenHeight: eventData.screenHeight,
          deviceType: eventData.deviceType,
          browserName: eventData.browserInfo?.name,
          browserVersion: eventData.browserInfo?.version,
          os: eventData.os
        },
        geoInfo: {
          ip,
          // You can integrate with a GeoIP service here
          country: 'Unknown',
          city: 'Unknown',
          region: 'Unknown'
        }
      })
      
      await newSession.save()
    }
  } catch (error) {
    console.error('Session update error:', error)
  }
} 