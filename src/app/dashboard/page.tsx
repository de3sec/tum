'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import WebsiteList from '@/components/dashboard/WebsiteList'
import AddWebsiteModal from '@/components/dashboard/AddWebsiteModal'

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

export default function DashboardPage() {
  const { user, loading, session } = useAuth()
  const router = useRouter()
  const [websites, setWebsites] = useState<Website[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && session) {
      fetchWebsites()
    }
  }, [user, session])

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setWebsites(data.websites)
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddWebsite = async (websiteData: { name: string; domain: string }) => {
    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(websiteData),
      })

      if (response.ok) {
        await fetchWebsites()
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Failed to add website:', error)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={user}
        onAddWebsite={() => setShowAddModal(true)}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <WebsiteList 
            websites={websites}
            isLoading={isLoading}
            onRefresh={fetchWebsites}
          />
        </div>
      </main>

      {showAddModal && (
        <AddWebsiteModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddWebsite}
        />
      )}
    </div>
  )
} 