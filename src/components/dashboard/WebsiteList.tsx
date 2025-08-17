'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Globe, Copy, Settings, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { PlatformSelector } from '@/components/ui/PlatformSelector'
import { toast } from 'sonner'

const platforms = [
  { id: 'wordpress', name: 'WordPress' },
  { id: 'shopify', name: 'Shopify' },
  { id: 'wix', name: 'Wix' },
  { id: 'nextjs', name: 'Next.js' },
  { id: 'custom', name: 'Custom' },
]

interface Website {
  id: string
  name: string
  domain: string
  trackingId: string
  isActive: boolean
  createdAt: string
  settings: {
    trackClicks: boolean
    trackScrolls: boolean
    trackPageViews: boolean
    trackUserSessions: boolean
    samplingRate: number
  }
}

interface WebsiteListProps {
  websites: Website[]
  isLoading: boolean
  onRefresh: () => void
}

export default function WebsiteList({ websites, isLoading, onRefresh }: WebsiteListProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('shopify')

  const copyTrackingCode = (trackingId: string, domain: string, platform: string) => {
    let trackingCode = ''
    switch (platform) {
      case 'wordpress':
        trackingCode = `<!-- WordPress Tracking Code -->
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/script?id=${trackingId}" async></script>
<!-- End WordPress Tracking Code -->`
        break
      case 'shopify':
        trackingCode = `<!-- Shopify Tracking Code -->
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/script?id=${trackingId}" async></script>
<!-- End Shopify Tracking Code -->`
        break
      case 'wix':
        trackingCode = `<!-- Wix Tracking Code -->
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/script?id=${trackingId}" async></script>
<!-- End Wix Tracking Code -->`
        break
      case 'nextjs':
        trackingCode = `<Script
src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/script?id=${trackingId}"
strategy="afterInteractive"/>`
        break
      default:
        trackingCode = `<!-- Custom Tracking Code -->
<script>
  window.ANALYTICS_CONFIG = {
    trackingId: '${trackingId}',
    endpoint: '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/collect'
  };
</script>
<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/script?id=${trackingId}" async></script>
<!-- End Custom Tracking Code -->`
    }
    
    navigator.clipboard.writeText(trackingCode)
    toast.success('Tracking code copied to clipboard')
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (websites.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No websites</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first website to track.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {websites.map((website) => (
        <Card key={website.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{website.name}</CardTitle>
              <Badge variant={website.isActive ? "default" : "secondary"}>
                {website.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <CardDescription>{website.domain}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Tracking ID: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{website.trackingId}</code></p>
                <p>Created {formatDistanceToNow(new Date(website.createdAt), { addSuffix: true })}</p>
              </div>
              
              <PlatformSelector selectedPlatform={selectedPlatform} onSelect={setSelectedPlatform} platforms={platforms} />
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/analytics/${website.id}`, '_blank')}
                  className="flex items-center space-x-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  <span>Analytics</span>
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyTrackingCode(website.trackingId, website.domain, selectedPlatform)}
                  className="flex items-center space-x-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy Code</span>
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <Settings className="h-3 w-3" />
                  <span>Settings</span>
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                Features: {[
                  website.settings.trackPageViews && "Page Views",
                  website.settings.trackClicks && "Clicks",
                  website.settings.trackScrolls && "Scrolling",
                  website.settings.trackUserSessions && "Sessions"
                ].filter(Boolean).join(", ")}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 