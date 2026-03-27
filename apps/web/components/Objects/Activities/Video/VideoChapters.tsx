import React from 'react'

interface VideoChapter {
  title: string
  time: number
}

interface VideoChaptersProps {
  chapters?: VideoChapter[]
  onChapterClick: (time: number) => void
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function VideoChapters({
  chapters,
  onChapterClick,
}: VideoChaptersProps) {
  if (!chapters || chapters.length === 0) return null

  return (
    <aside className="w-full lg:w-72 shrink-0 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
      <h3 className="text-base font-semibold mb-3">Video Chapters</h3>

      <div className="flex flex-col gap-2">
        {chapters.map((chapter, index) => (
          <button
            key={`${chapter.title}-${index}`}
            type="button"
            onClick={() => onChapterClick(chapter.time)}
            className="w-full text-left rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
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