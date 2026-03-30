'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import { updateActivity } from '@services/courses/activities'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import VideoChaptersEditor from '@components/Objects/Activities/Video/VideoChaptersEditor'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VideoEditPage() {
  const params = useParams()
  const router = useRouter()

  const activityid = params.activityid as string
  const courseuuid = params.courseuuid as string
  const orgslug = params.orgslug as string

  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const { data: course, mutate } = useSWR(
    access_token ? `${getAPIUrl()}courses/course_${courseuuid}/meta` : null,
    (url) => swrFetcher(url, access_token)
  )

  const activity = React.useMemo(() => {
    if (!course?.chapters) return null

    for (const chapter of course.chapters) {
      const found = chapter.activities.find(
        (a: any) => a.activity_uuid.replace('activity_', '') === activityid
      )
      if (found) return found
    }

    return null
  }, [course, activityid])

  const [chapters, setChapters] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isValid, setIsValid] = useState(false)

  React.useEffect(() => {
    if (activity?.details?.chapters) {
      setChapters(activity.details.chapters)
    } else if (activity && !activity?.details?.chapters) {
      setChapters([])
    }
  }, [activity])

  const save = async () => {

    console.log('SAVE CLICKED')

    if (!activity || !isValid) return

    try {
      setIsSaving(true)

      console.log('Sending chapters:', chapters)

      await updateActivity(
        {
          ...activity,
          details: {
            ...activity.details,
            chapters,
          },
        },
        activity.activity_uuid,
        access_token
      )

      await mutate()
      toast.success('Video chapters saved')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save video chapters')
    } finally {
      setIsSaving(false)
    }
  }

  if (!course) {
    return <div className="p-6">Loading course...</div>
  }

  if (!activity) {
    return <div className="p-6">Loading activity...</div>
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            router.push(
              getUriWithOrg(orgslug, `/dash/courses/course/${courseuuid}/content`)
            )
          }
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <ArrowLeft size={16} />
          Back to Activity
        </button>

        <button
          type="button"
          onClick={save}
          disabled={isSaving || !isValid}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            isSaving || !isValid
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">
            Edit Video Chapters
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Manage chapter sections, subchapters, descriptions, and timestamps
            for this video activity.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
            Activity
          </div>
          <div className="text-base font-semibold text-neutral-900">
            {activity.name}
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Video content is read-only here. Only chapter metadata can be edited.
          </div>
        </div>

        <VideoChaptersEditor
          value={chapters}
          onChange={setChapters}
          onValidityChange={setIsValid}
        />
      </div>
    </div>
  )
}