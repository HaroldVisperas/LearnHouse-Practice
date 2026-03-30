'use client'

import React, { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  FolderPlus,
  FilePlus2,
  Clock3,
  GripVertical,
  AlertTriangle,
} from 'lucide-react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'

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

interface Props {
  value: VideoChapterGroup[]
  onChange: (chapters: VideoChapterGroup[]) => void
  onValidityChange?: (valid: boolean) => void
}

function formatTime(totalSeconds?: number) {
  const sec = Math.max(0, Number(totalSeconds || 0))

  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = sec % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function parseTime(input: string): number | null {
  const trimmed = input.trim()

  if (!trimmed) return 0

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed)
  }

  const parts = trimmed.split(':').map((p) => p.trim())

  if (parts.length === 2) {
    const [m, s] = parts
    if (isNaN(+m) || isNaN(+s)) return null
    if (Number(s) >= 60) return null
    return Number(m) * 60 + Number(s)
  }

  if (parts.length === 3) {
    const [h, m, s] = parts
    if (isNaN(+h) || isNaN(+m) || isNaN(+s)) return null
    if (Number(m) >= 60 || Number(s) >= 60) return null
    return Number(h) * 3600 + Number(m) * 60 + Number(s)
  }

  return null
}

function sortByTime(chapters: VideoChapterGroup[]) {
  return [...chapters].sort((a, b) => {
    const aTime =
      typeof a.time === 'number'
        ? a.time
        : a.items?.[0]?.time ?? Number.MAX_SAFE_INTEGER

    const bTime =
      typeof b.time === 'number'
        ? b.time
        : b.items?.[0]?.time ?? Number.MAX_SAFE_INTEGER

    return aTime - bTime
  })
}

function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = [...list]
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

function validateTimestamps(chapters: VideoChapterGroup[]) {
  const warnings: string[] = []
  let lastTime = -1

  chapters.forEach((group) => {
    if (group.items && group.items.length > 0) {
      group.items.forEach((item) => {
        if (item.time < 0) {
          warnings.push(`"${item.title}" has a negative timestamp.`)
        }
        if (item.time < lastTime) {
          warnings.push(`"${item.title}" is earlier than the previous timestamp.`)
        }
        lastTime = item.time
      })
    } else if (typeof group.time === 'number') {
      if (group.time < 0) {
        warnings.push(`"${group.title}" has a negative timestamp.`)
      }
      if (group.time < lastTime) {
        warnings.push(`"${group.title}" is earlier than the previous timestamp.`)
      }
      lastTime = group.time
    }
  })

  return warnings
}

function validateChaptersStrict(chapters: VideoChapterGroup[]) {
  const errors: string[] = []
  const timeSet = new Set<number>()

  chapters.forEach((group, gIndex) => {
    const groupLabel = `Chapter ${gIndex + 1}`

    if (!group.title?.trim()) {
      errors.push(`${groupLabel} has no title.`)
    }

    if (group.items && group.items.length > 0) {
      group.items.forEach((sub, sIndex) => {
        const subLabel = `${groupLabel} → Sub ${sIndex + 1}`

        if (!sub.title?.trim()) {
          errors.push(`${subLabel} has no title.`)
        }

        if (typeof sub.time !== 'number') {
          errors.push(`${subLabel} has no valid timestamp.`)
        }

        if (timeSet.has(sub.time)) {
          errors.push(`${subLabel} has duplicate timestamp.`)
        }

        timeSet.add(sub.time)
      })
    } else {
      if (typeof group.time !== 'number') {
        errors.push(`${groupLabel} has no timestamp.`)
      }

      if (timeSet.has(group.time!)) {
        errors.push(`${groupLabel} has duplicate timestamp.`)
      }

      timeSet.add(group.time!)
    }
  })

  return errors
}

function TimeInputField({
  value,
  onCommit,
}: {
  value: number
  onCommit: (time: number) => void
}) {
  const [inputValue, setInputValue] = useState(formatTime(value))
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    setInputValue(formatTime(value))
  }, [value])

  const commitValue = () => {
    const parsed = parseTime(inputValue)

    if (parsed === null) {
      setError('Use ss, mm:ss, or hh:mm:ss')
      return
    }

    setError(null)
    onCommit(parsed)
    setInputValue(formatTime(parsed))
  }

  return (
    <div>
      <input
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-neutral-300 focus:border-blue-500'
        }`}
        placeholder="0:00 or 1:02:30"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          if (error) setError(null)
        }}
        onBlur={commitValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commitValue()
          }
        }}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}

export default function VideoChaptersEditor({
  value,
  onChange,
  onValidityChange,
}: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    new Set(value.map((_, index) => index))
  )

  const chapters = useMemo(() => value || [], [value])
  const timestampWarnings = useMemo(() => validateTimestamps(chapters), [chapters])
  const validationErrors = useMemo(() => validateChaptersStrict(chapters), [chapters])
  const isValid = validationErrors.length === 0

  React.useEffect(() => {
    onValidityChange?.(isValid)
  }, [isValid, onValidityChange])

  const update = (newValue: VideoChapterGroup[]) => {
    onChange([...newValue])
  }

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const addLeafChapter = () => {
    update(
      sortByTime([
        ...chapters,
        {
          title: 'New Chapter',
          description: '',
          time: 0,
        },
      ])
    )
  }

  const addGroup = () => {
    const next = [
      ...chapters,
      {
        title: 'New Section',
        description: '',
        items: [
          {
            title: 'New Subchapter',
            description: '',
            time: 0,
          },
        ],
      },
    ]
    update(next)

    setExpandedGroups((prev) => {
      const copy = new Set(prev)
      copy.add(next.length - 1)
      return copy
    })
  }

  const updateGroup = (index: number, newGroup: VideoChapterGroup) => {
    const copy = [...chapters]
    copy[index] = newGroup
    update(copy)
  }

  const deleteGroup = (index: number) => {
    const next = chapters.filter((_, i) => i !== index)
    update(next)

    setExpandedGroups((prev) => {
      const adjusted = new Set<number>()
      Array.from(prev).forEach((oldIndex) => {
        if (oldIndex === index) return
        adjusted.add(oldIndex > index ? oldIndex - 1 : oldIndex)
      })
      return adjusted
    })
  }

  const addSubchapter = (groupIndex: number) => {
    const copy = [...chapters]
    const group = copy[groupIndex]

    group.items = group.items || []
    group.items.push({
      title: 'New Subchapter',
      description: '',
      time: 0,
    })

    update(copy)

    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.add(groupIndex)
      return next
    })
  }

  const updateSubchapter = (
    groupIndex: number,
    subIndex: number,
    newSub: VideoSubChapter
  ) => {
    const copy = [...chapters]
    if (!copy[groupIndex].items) copy[groupIndex].items = []
    copy[groupIndex].items![subIndex] = newSub
    update(copy)
  }

  const deleteSubchapter = (groupIndex: number, subIndex: number) => {
    const copy = [...chapters]
    copy[groupIndex].items = (copy[groupIndex].items || []).filter(
      (_, i) => i !== subIndex
    )
    update(copy)
  }

  const convertLeafToGroup = (groupIndex: number) => {
    const copy = [...chapters]
    const current = copy[groupIndex]

    copy[groupIndex] = {
      title: current.title,
      description: current.description,
      items: [
        {
          title: 'New Subchapter',
          description: '',
          time: typeof current.time === 'number' ? current.time : 0,
        },
      ],
    }

    update(copy)

    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.add(groupIndex)
      return next
    })
  }

  const convertGroupToLeaf = (groupIndex: number) => {
    const copy = [...chapters]
    const current = copy[groupIndex]

    copy[groupIndex] = {
      title: current.title,
      description: current.description,
      time: current.items?.[0]?.time ?? 0,
    }

    update(copy)
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result
    if (!destination) return

    if (type === 'GROUP') {
      if (source.index === destination.index) return

      const reordered = reorderArray(chapters, source.index, destination.index)
      update(reordered)

      setExpandedGroups((prev) => {
        const expandedByOldIndex = Array.from(prev)
        const nextSet = new Set<number>()

        reordered.forEach((_, newIndex) => {
          const oldIndex = chapters.findIndex((g) => g === reordered[newIndex])
          if (expandedByOldIndex.includes(oldIndex)) {
            nextSet.add(newIndex)
          }
        })

        return nextSet
      })

      return
    }

    if (type.startsWith('SUBCHAPTERS-')) {
      const groupIndex = Number(type.replace('SUBCHAPTERS-', ''))
      if (Number.isNaN(groupIndex)) return
      if (source.index === destination.index) return

      const copy = [...chapters]
      const items = copy[groupIndex].items || []
      copy[groupIndex] = {
        ...copy[groupIndex],
        items: reorderArray(items, source.index, destination.index),
      }

      update(copy)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Video source is locked</div>
        <div>
          Teachers can edit chapter groups, subchapters, descriptions, and
          timestamps here. To change the video itself, create a new video
          activity.
        </div>
      </div>

      {timestampWarnings.length > 0 && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            Timestamp warnings
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {timestampWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            Cannot save yet
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {validationErrors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addLeafChapter}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <FilePlus2 size={16} />
          Add Chapter
        </button>

        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          <FolderPlus size={16} />
          Add Section
        </button>
      </div>

      {chapters.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No chapters yet. Add a chapter or section to start building the video
          outline.
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chapter-groups" type="GROUP">
          {(provided) => (
            <div
              className="space-y-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {chapters.map((group, groupIndex) => {
                const hasSubchapters = !!group.items && group.items.length > 0
                const isExpanded = expandedGroups.has(groupIndex)

                return (
                  <Draggable
                    key={`group-${groupIndex}`}
                    draggableId={`group-${groupIndex}`}
                    index={groupIndex}
                  >
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className="rounded-2xl border border-neutral-200 bg-white shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 p-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              {...dragProvided.dragHandleProps}
                              className="mt-1 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              <GripVertical size={16} />
                            </button>

                            {hasSubchapters ? (
                              <button
                                type="button"
                                onClick={() => toggleGroup(groupIndex)}
                                className="mt-1 rounded-md p-1 hover:bg-neutral-100"
                              >
                                {isExpanded ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </button>
                            ) : (
                              <div className="mt-1 rounded-md p-1 text-neutral-300">
                                <Clock3 size={16} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                                {hasSubchapters ? 'Section' : 'Chapter'}
                              </div>

                              <input
                                className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none ${
                                  !group.title?.trim()
                                    ? 'border-red-400 focus:border-red-500'
                                    : 'border-neutral-300 focus:border-blue-500'
                                }`}
                                placeholder={
                                  hasSubchapters ? 'Section title' : 'Chapter title'
                                }
                                value={group.title}
                                onChange={(e) =>
                                  updateGroup(groupIndex, {
                                    ...group,
                                    title: e.target.value,
                                  })
                                }
                              />

                              {!group.title?.trim() && (
                                <div className="text-xs text-red-500 mt-1">
                                  Title is required
                                </div>
                              )}

                              <textarea
                                className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                placeholder="Description"
                                rows={3}
                                value={group.description || ''}
                                onChange={(e) =>
                                  updateGroup(groupIndex, {
                                    ...group,
                                    description: e.target.value,
                                  })
                                }
                              />

                              {!hasSubchapters && (
                                <div className="mt-3 max-w-[220px]">
                                  <label className="mb-1 block text-xs font-medium text-neutral-600">
                                    Time (ss / mm:ss / hh:mm:ss)
                                  </label>
                                  <TimeInputField
                                    value={group.time ?? 0}
                                    onCommit={(parsedTime) =>
                                      updateGroup(groupIndex, {
                                        ...group,
                                        time: parsedTime,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            {!hasSubchapters ? (
                              <button
                                type="button"
                                onClick={() => convertLeafToGroup(groupIndex)}
                                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                              >
                                Convert to Section
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => addSubchapter(groupIndex)}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                >
                                  + Subchapter
                                </button>

                                <button
                                  type="button"
                                  onClick={() => convertGroupToLeaf(groupIndex)}
                                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                >
                                  Convert to Chapter
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => deleteGroup(groupIndex)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>

                        {hasSubchapters && isExpanded && (
                          <Droppable
                            droppableId={`subchapters-${groupIndex}`}
                            type={`SUBCHAPTERS-${groupIndex}`}
                          >
                            {(subProvided) => (
                              <div
                                ref={subProvided.innerRef}
                                {...subProvided.droppableProps}
                                className="space-y-3 p-4"
                              >
                                {(group.items || []).map((sub, subIndex) => (
                                  <Draggable
                                    key={`group-${groupIndex}-sub-${subIndex}`}
                                    draggableId={`group-${groupIndex}-sub-${subIndex}`}
                                    index={subIndex}
                                  >
                                    {(subDragProvided) => (
                                      <div
                                        ref={subDragProvided.innerRef}
                                        {...subDragProvided.draggableProps}
                                        className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <button
                                              type="button"
                                              {...subDragProvided.dragHandleProps}
                                              className="mt-1 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 cursor-grab active:cursor-grabbing"
                                              title="Drag to reorder"
                                            >
                                              <GripVertical size={16} />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                                                Subchapter {subIndex + 1}
                                              </div>

                                              <input
                                                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium outline-none ${
                                                  !sub.title?.trim()
                                                    ? 'border-red-400 focus:border-red-500'
                                                    : 'border-neutral-300 focus:border-blue-500'
                                                }`}
                                                placeholder="Subchapter title"
                                                value={sub.title}
                                                onChange={(e) =>
                                                  updateSubchapter(groupIndex, subIndex, {
                                                    ...sub,
                                                    title: e.target.value,
                                                  })
                                                }
                                              />

                                              {!sub.title?.trim() && (
                                                <div className="text-xs text-red-500 mt-1">
                                                  Title is required
                                                </div>
                                              )}

                                              <textarea
                                                className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                placeholder="Description"
                                                rows={2}
                                                value={sub.description || ''}
                                                onChange={(e) =>
                                                  updateSubchapter(groupIndex, subIndex, {
                                                    ...sub,
                                                    description: e.target.value,
                                                  })
                                                }
                                              />

                                              <div className="mt-3 max-w-[220px]">
                                                <label className="mb-1 block text-xs font-medium text-neutral-600">
                                                  Time (ss / mm:ss / hh:mm:ss)
                                                </label>
                                                <TimeInputField
                                                  value={sub.time}
                                                  onCommit={(parsedTime) =>
                                                    updateSubchapter(groupIndex, subIndex, {
                                                      ...sub,
                                                      time: parsedTime,
                                                    })
                                                  }
                                                />
                                              </div>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteSubchapter(groupIndex, subIndex)
                                            }
                                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 shrink-0"
                                          >
                                            <Trash2 size={14} />
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}

                                {subProvided.placeholder}

                                <button
                                  type="button"
                                  onClick={() => addSubchapter(groupIndex)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                >
                                  <Plus size={16} />
                                  Add another subchapter
                                </button>
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    )}
                  </Draggable>
                )
              })}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}