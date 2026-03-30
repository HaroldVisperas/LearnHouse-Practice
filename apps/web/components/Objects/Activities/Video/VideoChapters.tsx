import React, { useEffect, useRef, useMemo, useState } from 'react'

interface VideoSubChapter {
  title: string
  description?: string
  time: number
}

interface VideoChapterGroup {
  title: string
  description?: string
  time?: number
  items?: VideoSubChapter[]
}

interface VideoChaptersProps {
  chapters?: VideoChapterGroup[]
  currentTime: number
  onChapterClick: (time: number) => void
  containerHeight?: number
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getActiveChapterIndex(
  chapters: { title: string; time: number }[],
  currentTime: number
) {
  for (let i = 0; i < chapters.length; i++) {
    const current = chapters[i]
    const next = chapters[i + 1]

    if (!next || currentTime < next.time) {
      return i
    }
  }
  return 0
}

function getFlattenedChapters(chapters: VideoChapterGroup[]) {
  const flat: { title: string; time: number }[] = []

  chapters.forEach((group) => {
    if (typeof group.time === 'number') {
      flat.push({ title: group.title, time: group.time })
    }

    group.items?.forEach((item) => {
      flat.push({ title: item.title, time: item.time })
    })
  })

  return flat.sort((a, b) => a.time - b.time)
}

export default function VideoChapters({
  chapters,
  currentTime,
  onChapterClick,
  containerHeight,
}: VideoChaptersProps) {
  if (!chapters || chapters.length === 0) return null

  const containerRef = useRef<HTMLDivElement>(null)
  const chapterRefs = useRef<(HTMLButtonElement | null)[]>([])
  const prevIndexRef = useRef<number | null>(null)

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  const flatChapters = useMemo(() => getFlattenedChapters(chapters), [chapters])
  const activeFlatIndex = getActiveChapterIndex(flatChapters, currentTime)
  const activeTime = flatChapters[activeFlatIndex]?.time

  // ✅ Auto-scroll (centered)
  useEffect(() => {
    if (prevIndexRef.current === activeFlatIndex) return
    prevIndexRef.current = activeFlatIndex

    const container = containerRef.current
    const activeEl = chapterRefs.current[activeFlatIndex]

    if (!container || !activeEl) return

    const visibleHeight = container.clientHeight
    const itemTop = activeEl.offsetTop
    const itemHeight = activeEl.offsetHeight

    const targetScrollTop =
      itemTop - visibleHeight / 2 + itemHeight / 2

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    })
  }, [activeFlatIndex])

  // ✅ Auto-expand active group
  useEffect(() => {
    chapters.forEach((group, groupIndex) => {
      const hasActiveChild =
        group.items?.some((item) => item.time === activeTime)

      if (hasActiveChild) {
        setExpandedGroups((prev) => {
          const newSet = new Set(prev)
          newSet.add(groupIndex)
          return newSet
        })
      }
    })
  }, [activeTime, chapters])

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  let flatIndexCounter = -1

  return (
    <aside
      className="w-full lg:w-72 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col overflow-hidden"
      style={{
        height: containerHeight ? `${containerHeight}px` : undefined,
      }}
    >
      <h3 className="text-base font-semibold p-4 pb-3">Video Chapters</h3>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4 min-h-0"
      >
        {chapters.map((group, groupIndex) => {
          let groupFlatIndex: number | null = null

          if (typeof group.time === 'number') {
            flatIndexCounter += 1
            groupFlatIndex = flatIndexCounter
          }

          const isExpanded = expandedGroups.has(groupIndex)

          const groupIsActive =
            (typeof group.time === 'number' &&
              activeTime === group.time) ||
            group.items?.some((item) => item.time === activeTime)

          return (
            <div
              key={`${group.title}-${groupIndex}`}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3"
            >
              <button
                ref={(el) => {
                  if (groupFlatIndex !== null) {
                    chapterRefs.current[groupFlatIndex] = el
                  }
                }}
                type="button"
                onClick={() => {
                  if (group.items && group.items.length > 0) {
                    toggleGroup(groupIndex)
                  } else if (typeof group.time === 'number') {
                    onChapterClick(group.time)
                  }
                }}
                className="w-full text-left flex justify-between items-start"
              >
                <div>
                  <div
                    className={`text-sm font-semibold ${
                      groupIsActive ? 'text-blue-600' : ''
                    }`}
                  >
                    {group.title}
                  </div>

                  {group.description && (
                    <div className="text-xs text-neutral-600 mt-1">
                      {group.description}
                    </div>
                  )}

                  {typeof group.time === 'number' && (
                    <div className="text-xs text-neutral-500 mt-2">
                      {formatTime(group.time)}
                    </div>
                  )}
                </div>

                {group.items && (
                  <span className="text-xs text-neutral-500 ml-2">
                    {isExpanded ? '−' : '+'}
                  </span>
                )}
              </button>

              {group.items &&
                group.items.length > 0 &&
                isExpanded && (
                  <div className="mt-3 flex flex-col gap-3">
                    {group.items.map((item, itemIndex) => {
                      flatIndexCounter += 1
                      const itemFlatIndex = flatIndexCounter
                      const itemIsActive = activeTime === item.time

                      return (
                        <button
                          key={`${item.title}-${itemIndex}`}
                          ref={(el) => {
                            chapterRefs.current[itemFlatIndex] = el
                          }}
                          type="button"
                          onClick={() => onChapterClick(item.time)}
                          className={`w-full text-left rounded-lg border px-3 py-3 transition ${
                            itemIsActive
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {item.title}
                          </div>

                          {item.description && (
                            <div
                              className={`text-xs mt-1 ${
                                itemIsActive
                                  ? 'text-white/80'
                                  : 'text-neutral-600'
                              }`}
                            >
                              {item.description}
                            </div>
                          )}

                          <div
                            className={`text-xs mt-2 ${
                              itemIsActive
                                ? 'text-white/80'
                                : 'text-neutral-500'
                            }`}
                          >
                            {formatTime(item.time)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}