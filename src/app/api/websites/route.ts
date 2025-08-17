import { NextRequest, NextResponse } from 'next/server'
import dbConnect, { Website } from '@/lib/mongodb'
import { createServerClient } from '@/lib/supabase'
import { generateTrackingId, generateWebsiteId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get user from auth header
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
    
    const websites = await Website.find({ userId: user.id }).sort({ createdAt: -1 })
    
    return NextResponse.json({ websites })
  } catch (error) {
    console.error('Websites fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { domain, name, settings = {} } = body
    
    if (!domain || !name) {
      return NextResponse.json(
        { error: 'Domain and name are required' },
        { status: 400 }
      )
    }

    await dbConnect()
    
    // Check if domain already exists for this user
    const existingWebsite = await Website.findOne({ userId: user.id, domain })
    if (existingWebsite) {
      return NextResponse.json(
        { error: 'Domain already tracked' },
        { status: 409 }
      )
    }

    const website = new Website({
      id: generateWebsiteId(),
      userId: user.id,
      domain,
      name,
      trackingId: generateTrackingId(),
      settings: {
        trackClicks: settings.trackClicks ?? true,
        trackScrolls: settings.trackScrolls ?? true,
        trackPageViews: settings.trackPageViews ?? true,
        trackUserSessions: settings.trackUserSessions ?? true,
        samplingRate: settings.samplingRate ?? 1.0,
        excludePaths: settings.excludePaths || [],
        allowedDomains: settings.allowedDomains || [domain]
      }
    })

    await website.save()
    
    return NextResponse.json({ website }, { status: 201 })
  } catch (error) {
    console.error('Website creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 