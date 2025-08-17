import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  const hours = Math.floor(seconds / 3600)
  const remainingMinutes = Math.floor((seconds % 3600) / 60)
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function generateWebsiteId(): string {
  // Generate a unique website ID (e.g., "ws_" + random string)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'ws_'
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateTrackingId(): string {
  // Generate a unique tracking ID (e.g., "trk_" + random string)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'trk_'
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateSessionId(): string {
  // Generate a unique session ID
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'sess_'
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return 'mobile'
  }
  if (/tablet|ipad|kindle|silk/i.test(ua)) {
    return 'tablet'
  }
  return 'desktop'
}

export function parseBrowserInfo(userAgent: string): { name: string; version: string } {
  const ua = userAgent.toLowerCase()
  
  // Chrome
  if (ua.includes('chrome') && !ua.includes('edge') && !ua.includes('opr')) {
    const match = ua.match(/chrome\/(\d+\.\d+)/)
    return { name: 'Chrome', version: match ? match[1] : 'Unknown' }
  }
  
  // Firefox
  if (ua.includes('firefox')) {
    const match = ua.match(/firefox\/(\d+\.\d+)/)
    return { name: 'Firefox', version: match ? match[1] : 'Unknown' }
  }
  
  // Safari
  if (ua.includes('safari') && !ua.includes('chrome')) {
    const match = ua.match(/version\/(\d+\.\d+)/)
    return { name: 'Safari', version: match ? match[1] : 'Unknown' }
  }
  
  // Edge
  if (ua.includes('edge') || ua.includes('edg/')) {
    const match = ua.match(/(?:edge|edg)\/(\d+\.\d+)/)
    return { name: 'Edge', version: match ? match[1] : 'Unknown' }
  }
  
  // Opera
  if (ua.includes('opr') || ua.includes('opera')) {
    const match = ua.match(/(?:opr|opera)\/(\d+\.\d+)/)
    return { name: 'Opera', version: match ? match[1] : 'Unknown' }
  }
  
  return { name: 'Unknown', version: 'Unknown' }
}

export function parseOSInfo(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('windows nt 10')) return 'Windows 10'
  if (ua.includes('windows nt 6.3')) return 'Windows 8.1'
  if (ua.includes('windows nt 6.2')) return 'Windows 8'
  if (ua.includes('windows nt 6.1')) return 'Windows 7'
  if (ua.includes('windows')) return 'Windows'
  
  if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x (\d+[._]\d+)/)
    return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS'
  }
  if (ua.includes('mac')) return 'macOS'
  
  if (ua.includes('android')) {
    const match = ua.match(/android (\d+\.\d+)/)
    return match ? `Android ${match[1]}` : 'Android'
  }
  
  if (ua.includes('iphone') || ua.includes('ipad')) {
    const match = ua.match(/os (\d+[._]\d+)/)
    return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS'
  }
  
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('ubuntu')) return 'Ubuntu'
  if (ua.includes('fedora')) return 'Fedora'
  
  return 'Unknown'
}
