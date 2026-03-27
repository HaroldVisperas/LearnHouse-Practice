import React, { useEffect, useRef } from 'react'

interface VideoChapter {
  title: string
  time: number
}

interface VideoChaptersProps {
  chapters?: VideoChapter[]
  currentTime: number
  onChapterClick: (time: number) => void
  containerHeight?: number
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getActiveChapterIndex(chapters: VideoChapter[], currentTime: number) {
  for (let i = 0; i < chapters.length; i++) {
    const current = chapters[i]
    const next = chapters[i + 1]

    if (!next || currentTime < next.time) {
      return i
    }
  }
  return 0
}

export default function VideoChapters({
  chapters,
  currentTime,
  onChapterClick,
  containerHeight,
}: VideoChaptersProps) {
  if (!chapters || chapters.length === 0) return null

  const activeIndex = getActiveChapterIndex(chapters, currentTime)
  

  const containerRef = useRef<HTMLDivElement>(null)
  const chapterRefs = useRef<(HTMLButtonElement | null)[]>([])
  const prevIndexRef = useRef<number | null>(null)

  useEffect(() => {
    if (prevIndexRef.current === activeIndex) return
        prevIndexRef.current = activeIndex

        const container = containerRef.current
        const activeEl = chapterRefs.current[activeIndex]

    if (!container || !activeEl) return
        const containerHeight = container.clientHeight
        const itemTop = activeEl.offsetTop
        const itemHeight = activeEl.offsetHeight

        const targetScrollTop =
            itemTop - containerHeight / 2 + itemHeight / 2

        container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
    })
  }, [activeIndex])

  return (
    <aside
        className="w-full lg:w-72 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col overflow-hidden"
        style={{
            height: containerHeight ? `${containerHeight}px` : undefined,
        }}
    >
      <h3 className="text-base font-semibold p-4 pb-3">Video Chapters</h3>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2 min-h-0">
        {chapters.map((chapter, index) => (
          <button
            key={`${chapter.title}-${index}`}
            type="button"
            onClick={() => onChapterClick(chapter.time)}
            className={`w-full text-left rounded-md border px-3 py-2 transition ${
                index === activeIndex
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
            }`}
            ref={(el) => {
                chapterRefs.current[index] = el
            }}
          >
            <div className="text-sm font-medium">{chapter.title}</div>
            <div className="text-xs text-neutral-500">
              {formatTime(chapter.time)}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}