import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PlatformSelectorProps {
  selectedPlatform: string
  onSelect: (platform: string) => void
  platforms: Array<{ id: string, name: string }>
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatform, onSelect, platforms }) => {
  return (
    <Select value={selectedPlatform} onValueChange={onSelect}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Platform" />
      </SelectTrigger>
      <SelectContent>
        {platforms.map((platform) => (
          <SelectItem key={platform.id} value={platform.id}>
            {platform.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 