'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, AlertCircle, CheckCircle, Lightbulb, Sparkles } from 'lucide-react'

interface Insight {
  summary: string
  keyInsights: string[]
  recommendations: Array<{
    category: string
    title: string
    description: string
    priority: string
    expectedImpact: string
  }>
  metrics: {
    strengths: string[]
    improvements: string[]
  }
}

interface InsightsPanelProps {
  websiteId: string
}

export default function InsightsPanel({ websiteId }: InsightsPanelProps) {
  const { session } = useAuth()
  const [insights, setInsights] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInsights()
  }, [websiteId])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/insights/${websiteId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights)
      } else {
        setError('Failed to generate insights')
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
      setError('Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'performance':
        return <TrendingUp className="h-4 w-4" />
      case 'content':
        return <Lightbulb className="h-4 w-4" />
      case 'technical':
        return <AlertCircle className="h-4 w-4" />
      case 'ux':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>AI-Powered Insights</span>
        </CardTitle>
        <CardDescription>
          Get actionable recommendations based on your analytics data
        </CardDescription>
        <div className="flex justify-end">
          <Button onClick={fetchInsights} disabled={loading} size="sm">
            {loading ? 'Generating...' : 'Refresh Insights'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Analyzing your data with AI...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-medium text-blue-900 mb-2">Executive Summary</h3>
              <p className="text-blue-800 text-sm">{insights.summary}</p>
            </div>

            {/* Key Insights */}
            <div>
              <h3 className="font-medium mb-3">Key Insights</h3>
              <div className="space-y-2">
                {insights.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-medium mb-3">Recommendations</h3>
              <div className="space-y-4">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(rec.category)}
                        <h4 className="font-medium">{rec.title}</h4>
                      </div>
                      <Badge variant={getPriorityColor(rec.priority) as any}>
                        {rec.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="text-xs text-gray-500">
                      <strong>Expected Impact:</strong> {rec.expectedImpact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Strengths</span>
                </h4>
                <ul className="space-y-1">
                  {insights.metrics.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-800">• {strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Areas for Improvement</span>
                </h4>
                <ul className="space-y-1">
                  {insights.metrics.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-yellow-800">• {improvement}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center pt-4 border-t">
              Insights powered by AI • Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Click "Refresh Insights" to generate AI-powered recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 