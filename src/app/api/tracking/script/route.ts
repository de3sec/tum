import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingId = searchParams.get('id')
    
    if (!trackingId) {
      return new NextResponse('Missing tracking ID', { status: 400 })
    }

    // Read the tracking script
    const scriptPath = path.join(process.cwd(), 'public', 'tracking.js')
    const scriptContent = await readFile(scriptPath, 'utf8')
    
    // Inject configuration
    const configuredScript = `
// Analytics Configuration
window.ANALYTICS_CONFIG = {
  trackingId: '${trackingId}',
  endpoint: '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/collect'
};

${scriptContent}
`

    return new NextResponse(configuredScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Script serving error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 