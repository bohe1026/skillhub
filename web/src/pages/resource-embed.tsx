import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

const RESOURCE_PAGES = {
  'tech-solutions': {
    title: '泛科技解决方案中心',
    src: '/embedded/tech-solutions/index.html',
  },
  'industry-scenes': {
    title: '行业场景应用中心',
    src: '/embedded/industry-scenes/index.html',
  },
  'baidu-cloud-products': {
    title: '百度云产品功能介绍',
    src: '/embedded/baidu-cloud-products/index.html',
  },
} as const

type ResourcePageId = keyof typeof RESOURCE_PAGES

function resolveResourcePage(resourceId: string) {
  return RESOURCE_PAGES[resourceId as ResourcePageId] ?? null
}

export function ResourceEmbedPage() {
  const { resourceId } = useParams({ from: '/resources/$resourceId' })
  const resource = resolveResourcePage(resourceId)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(720)

  useEffect(() => {
    const handleResizeMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return
      if (event.data?.type !== 'skillcenter:embed-resize' || typeof event.data.height !== 'number') return

      setIframeHeight(event.data.height)
    }

    window.addEventListener('message', handleResizeMessage)
    return () => window.removeEventListener('message', handleResizeMessage)
  }, [])

  useEffect(() => {
    setIframeHeight(720)
  }, [resourceId])

  if (!resource) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center gap-5 px-4 text-slate-950">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Resource</p>
        <h1 className="text-4xl font-black">页面不存在</h1>
        <p className="text-base leading-7 text-slate-600">没有找到对应的资源页面。</p>
        <Link
          to="/"
          className="inline-flex h-11 w-fit items-center gap-2 bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <iframe
        ref={iframeRef}
        title={resource.title}
        src={resource.src}
        className="block w-full border-0 bg-white"
        style={{ height: iframeHeight }}
        scrolling="no"
        onLoad={() => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'skillcenter:measure-embed' },
            window.location.origin,
          )
        }}
      />
    </div>
  )
}
