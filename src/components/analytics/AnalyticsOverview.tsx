'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Eye, Clock, TrendingUp, MousePointer } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatNumber, formatDuration } from '@/lib/utils'
import InsightsPanel from './InsightsPanel'

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

interface AnalyticsOverviewProps {
  data: AnalyticsData
  websiteId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AnalyticsOverview({ data, websiteId }: AnalyticsOverviewProps) {
  const { overview, topPages, deviceBreakdown, dailyStats } = data

  const stats = [
    {
      name: 'Total Page Views',
      value: formatNumber(overview.totalPageViews),
      icon: Eye,
      color: 'text-blue-600'
    },
    {
      name: 'Unique Visitors',
      value: formatNumber(overview.uniqueVisitors),
      icon: Users,
      color: 'text-green-600'
    },
    {
      name: 'Total Sessions',
      value: formatNumber(overview.totalSessions),
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      name: 'Avg. Session Duration',
      value: formatDuration(overview.avgSessionDuration),
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      name: 'Bounce Rate',
      value: `${(overview.bounceRate * 100).toFixed(1)}%`,
      icon: MousePointer,
      color: 'text-red-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stat.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Traffic</CardTitle>
            <CardDescription>Page views and sessions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Page Views"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>Traffic distribution by device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages.slice(0, 10).map((page, index) => (
                <div key={page.url} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {page.url}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatNumber(page.uniqueViews)} unique views
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatNumber(page.views)}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <InsightsPanel websiteId={websiteId} />
      </div>
    </div>
  )
} 