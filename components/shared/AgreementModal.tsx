'use client'

import React, { useState, useRef } from 'react'

interface AgreementModalProps {
  title: string;
  content: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function AgreementModal({ title, content, onAccept, onDecline }: AgreementModalProps) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      if (scrollHeight - clientHeight - scrollTop <= 3) {
        setIsScrolledToBottom(true)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full flex flex-col max-h-[80vh]">
        <div className="p-4 border-b font-bold text-lg">{title}</div>
        
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="p-4 overflow-y-auto flex-1 text-sm text-gray-700 whitespace-pre-wrap"
        >
          {content}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
          <button 
            onClick={onDecline}
            className="px-4 py-2 rounded text-gray-700 hover:bg-gray-200"
          >
            Decline
          </button>
          <button 
            onClick={onAccept}
            disabled={!isScrolledToBottom}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
