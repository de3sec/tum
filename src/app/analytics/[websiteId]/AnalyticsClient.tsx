'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Eye, Clock, MousePointer, Activity } from 'lucide-react'
import AnalyticsOverview from '@/components/analytics/AnalyticsOverview'
import HeatmapViewer from '@/components/analytics/HeatmapViewer'
import RealTimeStats from '@/components/analytics/RealTimeStats'
import { formatNumber, formatDuration } from '@/lib/utils'

interface AnalyticsData {
  overview: {
    totalPageViews: number
    uniqueVisitors: number
    totalSessions: number
    avgSessionDuration: number
    bounceRate: number
  }
  topPages: Array<{
    url: string
    views: number
    uniqueViews: number
  }>
  deviceBreakdown: Array<{
    _id: string
    count: number
  }>
  dailyStats: Array<{
    date: string
    pageViews: number
    sessions: number
  }>
}

interface AnalyticsClientProps {
  websiteId: string
}

export default function AnalyticsClient({ websiteId }: AnalyticsClientProps) {
  const { user, loading, session } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [website, setWebsite] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && session) {
      fetchWebsiteData()
      fetchAnalyticsData()
    }
  }, [user, session, websiteId])

  const fetchWebsiteData = async () => {
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setWebsite(data.website)
      }
    } catch (error) {
      console.error('Failed to fetch website:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/analytics/${websiteId}?type=overview`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || !user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!website || !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Website not found</h3>
          <p className="text-gray-500">The website you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{website.name}</h1>
                <p className="text-sm text-gray-500">{website.domain}</p>
              </div>
              
              <Badge variant={website.isActive ? "default" : "secondary"}>
                {website.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <RealTimeStats websiteId={websiteId} />
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: Activity },
                { id: 'heatmap', name: 'Heatmap', icon: MousePointer },
                { id: 'realtime', name: 'Real-time', icon: Activity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && (
            <AnalyticsOverview 
              data={analyticsData} 
              websiteId={websiteId}
            />
          )}
          
          {activeTab === 'heatmap' && (
            <HeatmapViewer websiteId={websiteId} />
          )}
          
          {activeTab === 'realtime' && (
            <RealTimeStats websiteId={websiteId} detailed />
          )}
        </div>
      </main>
    </>
  )
} 