'use client'

import React, { useState, useEffect } from 'react'

interface TimerDisplayProps {
  initialSeconds: number;
  onExpire?: () => void;
}

export function TimerDisplay({ initialSeconds, onExpire }: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onExpire])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="sticky top-0 bg-yellow-50 border-b border-yellow-200 p-3 text-center font-mono font-bold text-yellow-800 z-50">
      Time Remaining: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  )
}
