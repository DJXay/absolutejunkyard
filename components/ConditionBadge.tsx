import React from 'react'
import type { ItemCondition } from '@/types'

interface ConditionBadgeProps {
  condition: ItemCondition
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ConditionBadge({ 
  condition, 
  size = 'md',
  className = ''
}: ConditionBadgeProps) {
  
  // Format enum to readable string (e.g., 'surprisingly_good' -> 'Surprisingly Good')
  const formatCondition = (cond: string) => {
    return cond.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getColorStyles = (cond: ItemCondition) => {
    switch (cond) {
      case 'junk':
        return 'bg-red-950/40 text-red-400 border-red-800/50'
      case 'fair':
        return 'bg-yellow-950/40 text-yellow-400 border-yellow-800/50'
      case 'surprisingly_good':
        return 'bg-green-950/40 text-green-400 border-green-800/50'
      default:
        return 'bg-gray-800 text-gray-300 border-gray-600'
    }
  }

  const getSizeStyles = (s: string) => {
    switch (s) {
      case 'sm':
        return 'text-[10px] px-1.5 py-0.5 border'
      case 'lg':
        return 'text-sm px-3 py-1.5 border-2'
      case 'md':
      default:
        return 'text-xs px-2 py-1 border'
    }
  }

  return (
    <span 
      className={`inline-flex items-center justify-center font-medium rounded ${getColorStyles(condition)} ${getSizeStyles(size)} ${className}`}
    >
      {formatCondition(condition)}
    </span>
  )
}