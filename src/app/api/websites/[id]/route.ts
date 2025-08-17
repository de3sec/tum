import { NextRequest, NextResponse } from 'next/server'
import dbConnect, { Website } from '@/lib/mongodb'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createServerClient()
    
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
    
    const website = await Website.findOne({ id: id, userId: user.id })
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }
    
    return NextResponse.json({ website })
  } catch (error) {
    console.error('Website fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createServerClient()
    
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
    const { name, domain, settings, isActive } = body

    await dbConnect()
    
    const website = await Website.findOne({ id: id, userId: user.id })
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    // Update fields
    if (name !== undefined) website.name = name
    if (domain !== undefined) website.domain = domain
    if (isActive !== undefined) website.isActive = isActive
    if (settings !== undefined) {
      website.settings = { ...website.settings, ...settings }
    }
    
    await website.save()
    
    return NextResponse.json({ website })
  } catch (error) {
    console.error('Website update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createServerClient()
    
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
    
    const website = await Website.findOneAndDelete({ id: id, userId: user.id })
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Website deleted successfully' })
  } catch (error) {
    console.error('Website deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 