'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, Eye } from 'lucide-react'

interface RealTimeData {
  activeUsers: number
  recentEvents: Array<{
    eventType: string
    eventData: {
      url: string
      title: string
      deviceType: string
      browserName: string
    }
    timestamp: string
  }>
  topPages: Array<{
    _id: string
    views: number
  }>
}

interface RealTimeStatsProps {
  websiteId: string
  detailed?: boolean
}

export default function RealTimeStats({ websiteId, detailed = false }: RealTimeStatsProps) {
  const { session } = useAuth()
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRealTimeData()
    
    // Update every 30 seconds
    const interval = setInterval(fetchRealTimeData, 30000)
    return () => clearInterval(interval)
  }, [websiteId])

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch(`/api/analytics/${websiteId}?type=realtime`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setRealTimeData(data)
      }
    } catch (error) {
      console.error('Failed to fetch real-time data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'pageview':
        return <Eye className="h-3 w-3" />
      case 'click':
        return <Activity className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case 'pageview':
        return <Badge variant="default" className="text-xs">Page View</Badge>
      case 'click':
        return <Badge variant="secondary" className="text-xs">Click</Badge>
      case 'scroll':
        return <Badge variant="outline" className="text-xs">Scroll</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{eventType}</Badge>
    }
  }

  if (loading && !realTimeData) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  if (!detailed) {
    // Compact view for header
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{realTimeData?.activeUsers || 0} active users</span>
        </div>
      </div>
    )
  }

  // Detailed view for dedicated page
  return (
    <div className="space-y-6">
      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Active Users</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
          </CardTitle>
          <CardDescription>Users active in the last 5 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            {realTimeData?.activeUsers || 0}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Active users browsing your website right now
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Live Activity Feed</CardTitle>
            <CardDescription>Real-time user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {realTimeData?.recentEvents?.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                </div>
              ) : (
                realTimeData?.recentEvents?.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getEventTypeIcon(event.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getEventTypeBadge(event.eventType)}
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {event.eventData.title || event.eventData.url}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.eventData.deviceType} • {event.eventData.browserName}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages (Real-time) */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages Right Now</CardTitle>
            <CardDescription>Most viewed pages in the last 5 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realTimeData?.topPages?.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No page views yet</p>
                </div>
              ) : (
                realTimeData?.topPages?.map((page, index) => (
                  <div key={page._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {page._id}
                      </div>
                      <div className="text-xs text-gray-500">
                        Page #{index + 1}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-lg font-semibold text-gray-900">
                        {page.views}
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        views
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center text-xs text-gray-500">
        <Activity className="inline h-3 w-3 mr-1" />
        Updates automatically every 30 seconds
      </div>
    </div>
  )
} 