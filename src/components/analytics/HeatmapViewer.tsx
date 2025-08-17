'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MousePointer, Eye, Calendar } from 'lucide-react'

interface HeatmapData {
  x: number
  y: number
  element: string
  url: string
  timestamp: string
}

interface HeatmapViewerProps {
  websiteId: string
}

export default function HeatmapViewer({ websiteId }: HeatmapViewerProps) {
  const { session } = useAuth()
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [targetUrl, setTargetUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    fetchHeatmapData()
  }, [websiteId, targetUrl, dateRange])

  const fetchHeatmapData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: 'heatmap',
        ...(targetUrl && { url: targetUrl }),
        startDate: getStartDate().toISOString(),
        endDate: new Date().toISOString()
      })

      const response = await fetch(`/api/analytics/${websiteId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setHeatmapData(data)
      }
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = () => {
    const now = new Date()
    switch (dateRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const generateHeatmapVisualization = () => {
    if (!heatmapData.length) return null

    // Group clicks by position for intensity calculation
    const clickMap = new Map<string, number>()
    heatmapData.forEach(click => {
      const key = `${Math.round(click.x / 20) * 20},${Math.round(click.y / 20) * 20}`
      clickMap.set(key, (clickMap.get(key) || 0) + 1)
    })

    const maxClicks = Math.max(...Array.from(clickMap.values()))

    return Array.from(clickMap.entries()).map(([position, count]) => {
      const [x, y] = position.split(',').map(Number)
      const intensity = count / maxClicks
      
      return (
        <div
          key={position}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: x,
            top: y,
            width: 20 + (intensity * 30),
            height: 20 + (intensity * 30),
            backgroundColor: `rgba(255, 0, 0, ${0.2 + intensity * 0.6})`,
            transform: 'translate(-50%, -50%)',
          }}
          title={`${count} clicks at ${x}, ${y}`}
        />
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MousePointer className="h-5 w-5" />
            <span>Click Heatmap</span>
          </CardTitle>
          <CardDescription>
            Visualize where users click on your website pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Target URL (optional)
              </label>
              <Input
                id="url"
                placeholder="Enter specific URL to filter..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={fetchHeatmapData} disabled={loading}>
                {loading ? 'Loading...' : 'Update'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Visualization */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading heatmap data...</p>
            </div>
          ) : heatmapData.length === 0 ? (
            <div className="text-center py-12">
              <MousePointer className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No click data</h3>
              <p className="mt-1 text-sm text-gray-500">
                No clicks recorded for the selected criteria. Try adjusting the date range or URL filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Click Visualization</h3>
                <div className="text-sm text-gray-500">
                  {heatmapData.length} clicks recorded
                </div>
              </div>

              {/* Heatmap Container */}
              <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 min-h-[600px]">
                <div className="absolute inset-0 bg-white">
                  {generateHeatmapVisualization()}
                  
                  {/* Individual click points for detailed view */}
                  {heatmapData.slice(0, 100).map((click, index) => (
                    <div
                      key={index}
                      className="absolute w-2 h-2 bg-red-500 rounded-full opacity-30 pointer-events-none"
                      style={{
                        left: click.x,
                        top: click.y,
                        transform: 'translate(-50%, -50%)',
                      }}
                      title={`Click on ${click.element} at ${new Date(click.timestamp).toLocaleString()}`}
                    />
                  ))}
                </div>
                
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow border">
                  <h4 className="font-medium text-sm mb-2">Legend</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                      <span>Low activity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Medium activity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-800 rounded-full"></div>
                      <span>High activity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Click Details */}
      {heatmapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Clicks</CardTitle>
            <CardDescription>Latest click events recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {heatmapData.slice(0, 10).map((click, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {click.element} element
                    </div>
                    <div className="text-xs text-gray-500">
                      Position: ({click.x}, {click.y}) • {click.url}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(click.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 