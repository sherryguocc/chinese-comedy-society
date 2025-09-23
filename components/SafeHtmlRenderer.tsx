'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'

interface SafeHtmlRendererProps {
  htmlContent: string
  className?: string
  excerpt?: boolean
}

export default function SafeHtmlRenderer({ 
  htmlContent, 
  className = '', 
  excerpt = false 
}: SafeHtmlRendererProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果是摘要模式，提取纯文本并限制长度
  if (excerpt) {
    if (!mounted) {
      // SSR时显示简单文本
      const simpleText = htmlContent.replace(/<[^>]*>/g, '').substring(0, 150)
      return (
        <p className={`text-gray-600 ${className}`}>
          {simpleText}...
        </p>
      )
    }

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    const limitedText = textContent.length > 150 
      ? textContent.substring(0, 150) + '...' 
      : textContent
    
    return (
      <p className={`text-gray-600 ${className}`}>
        {limitedText}
      </p>
    )
  }

  // 防止SSR问题
  if (!mounted) {
    return (
      <div className={`prose prose-lg max-w-none prose-orange ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // 清理HTML内容，防止XSS攻击
  const cleanHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'img', 'a',
      'blockquote', 'code', 'pre',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'src', 'alt', 'href', 'title',
      'style', 'class',
      'target', 'rel'
    ],
    KEEP_CONTENT: true
  })

  return (
    <div 
      className={`prose prose-lg max-w-none prose-orange article-content ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}