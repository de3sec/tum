'use client'

import { User } from '@supabase/supabase-js'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Plus, LogOut, BarChart3 } from 'lucide-react'

interface DashboardHeaderProps {
  user: User
  onAddWebsite: () => void
}

export default function DashboardHeader({ user, onAddWebsite }: DashboardHeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button onClick={onAddWebsite} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Website</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">{user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 