import React from 'react'
import YouTube from 'react-youtube'
import { getActivityVideoStreamUrl } from '@services/media/media'
import { useOrg } from '@components/Contexts/OrgContext'
import LearnHousePlayer from './LearnHousePlayer'
import VideoChapters from './VideoChapters'

interface VideoChapter {
  title: string
  time: number
}

interface VideoDetails {
  startTime?: number
  endTime?: number | null
  autoplay?: boolean
  muted?: boolean
  chapters?: VideoChapter[]
}

interface VideoActivityProps {
  activity: {
    activity_sub_type: string
    activity_uuid: string
    content: {
      filename?: string
      uri?: string
    }
    details?: VideoDetails
  }
  course: {
    course_uuid: string
  }
  orgUuid?: string
}

function VideoActivity({ activity, course, orgUuid }: VideoActivityProps) {
  const org = useOrg() as any
  const resolvedOrgUuid = orgUuid || org?.org_uuid
  const [videoId, setVideoId] = React.useState('')
  const details = {
    ...(activity.details || {}),

    // TEMP TEST DATA (remove later)
    chapters: [
      { title: 'Introduction', time: 0 },
      { title: 'Topic Overview', time: 30 },
      { title: 'Main Example', time: 75 },
      { title: 'Summary', time: 140 },
      { title: 'Introduction', time: 0 },
      { title: 'Topic Overview', time: 30 },
      { title: 'Main Example', time: 75 },
      { title: 'Summary', time: 140 },
      { title: 'Introduction', time: 0 },
      { title: 'Topic Overview', time: 30 },
      { title: 'Main Example', time: 75 },
      { title: 'Summary', time: 140 },
      { title: 'Introduction', time: 0 },
      { title: 'Topic Overview', time: 30 },
      { title: 'Main Example', time: 75 },
      { title: 'Summary', time: 140 },
    ],
  }
  const [seekToTime, setSeekToTime] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (activity?.content?.uri) {
      var getYouTubeID = require('get-youtube-id')
      setVideoId(getYouTubeID(activity.content.uri))
    }
  }, [activity, org])

  React.useEffect(() => {
    const el = videoContainerRef.current
    if (!el) return

    const updateHeight = () => {
      setVideoHeight(el.offsetHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(el)

    window.addEventListener('resize', updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const getVideoSrc = () => {
    if (!activity.content?.filename) return ''
    return getActivityVideoStreamUrl(
      resolvedOrgUuid,
      course?.course_uuid,
      activity.activity_uuid,
      activity.content.filename
    )
  }

  const [currentTime, setCurrentTime] = React.useState(0)

  const videoContainerRef = React.useRef<HTMLDivElement>(null)

  const [videoHeight, setVideoHeight] = React.useState<number>(0)

  return (
    <div className="w-full max-w-full px-0 sm:px-4">
      {activity && (
        <>
          {activity.activity_sub_type === 'SUBTYPE_VIDEO_HOSTED' && (
            <div className="my-0 sm:my-3 md:my-5 w-full">
              
              {/* FLEX CONTAINER */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* VIDEO SIDE */}
                <div ref={videoContainerRef} className="flex-1 w-full">
                  {(() => {
                    const src = getVideoSrc()

                    return src ? (
                      <LearnHousePlayer
                        key={activity.activity_uuid}
                        src={src}
                        details={details}
                        seekToTime={seekToTime}
                        onSeekHandled={() => setSeekToTime(null)}
                        onTimeUpdateExternal={(time) => setCurrentTime(time)}
                      />
                    ) : null
                  })()}
                </div>

                {/* CHAPTERS SIDE */}
                <div className="w-full lg:w-72">
                  <VideoChapters
                    chapters={details.chapters}
                    currentTime={currentTime}
                    onChapterClick={(time) => setSeekToTime(time)}
                    containerHeight={videoHeight}
                  />
                </div>

              </div>
            </div>
          )}
          {activity.activity_sub_type === 'SUBTYPE_VIDEO_YOUTUBE' && (
            <div className="my-0 sm:my-3 md:my-5 w-full">
              <div className="relative w-full aspect-video sm:rounded-lg overflow-hidden ring-0 sm:ring-1 sm:ring-gray-200/10 sm:dark:ring-gray-700/20 shadow-none">
                <YouTube
                  className="w-full h-full"
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: activity.details?.autoplay ? 1 : 0,
                      mute: activity.details?.muted ? 1 : 0,
                      start: activity.details?.startTime || 0,
                      end: activity.details?.endTime || undefined,
                      controls: 1,
                      modestbranding: 1,
                      rel: 0
                    },
                  }}
                  videoId={videoId}
                  onReady={(event) => {
                    if (activity.details?.startTime) {
                      event.target.seekTo(activity.details.startTime, true)
                    }
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default VideoActivity
