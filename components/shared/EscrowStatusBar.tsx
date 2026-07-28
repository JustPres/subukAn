import React from 'react'
import { EscrowState } from '@/types'

interface EscrowStatusBarProps {
  budget: number;
  slots: number;
  status: EscrowState;
}

export function EscrowStatusBar({ budget, slots, status }: EscrowStatusBarProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 border-b text-sm font-medium">
      <div className="flex gap-4">
        <span>Budget: ₱{budget.toFixed(2)}</span>
        <span>Slots available: {slots}</span>
      </div>
      <div>
        Status: <span className="uppercase px-2 py-1 bg-white rounded text-xs border">{status}</span>
      </div>
    </div>
  )
}
