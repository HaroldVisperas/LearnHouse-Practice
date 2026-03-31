import React, { useState } from 'react'
import DynamicPageActivityImage from 'public/activities_types/dynamic-page-activity.png'
import VideoPageActivityImage from 'public//activities_types/video-page-activity.png'
import DocumentPdfPageActivityImage from 'public//activities_types/documentpdf-page-activity.png'
import AssignmentActivityImage from 'public//activities_types/assignment-page-activity.png'
import PeerReviewActivityImage from 'public//activities_types/peerreview-page-activity.png'

import DynamicCanvaModal from './NewActivityModal/DynamicActivityModal'
import VideoModal from './NewActivityModal/VideoActivityModal'
import Image from 'next/image'
import DocumentPdfModal from './NewActivityModal/DocumentActivityModal'
import Assignment from './NewActivityModal/AssignmentActivityModal'
import { useTranslation } from 'react-i18next'
import PeerReviewActivityModal from './NewActivityModal/PeerReviewActivityModal'
import { truncate } from 'fs'

function NewActivityModal({
  closeModal,
  submitActivity,
  submitFileActivity,
  submitExternalVideo,
  chapterId,
  course,
}: any) {
  const { t } = useTranslation()
  const [selectedView, setSelectedView] = useState('home')

  const createPracticeQuizActivity = async () => {
    await submitActivity({
      name: 'New Practice Quiz',
      activity_type: 'TYPE_DYNAMIC',
      activity_sub_type: 'SUBTYPE_CUSTOM_PRACTICE_QUIZ',
      content: {},
      details: {
        questions: [],
      },
      published: true,
    })
  }

  return (
    <>
      {selectedView === 'home' && (
        <div className="grid grid-cols-4 gap-2 mt-2.5 w-full">
          <ActivityOption
            onClick={() => {
              setSelectedView('dynamic')
            }}
          >
            <div className="h-20 rounded-lg m-0.5 flex flex-col items-center justify-end text-center bg-white hover:cursor-pointer">
              <Image
                unoptimized
                quality={100}
                alt="Dynamic Page"
                src={DynamicPageActivityImage}
              />
            </div>
            <div className="flex text-sm h-5 font-medium text-gray-500 items-center justify-center text-center">
              {t('dashboard.courses.structure.activity.types.dynamic_page')}
            </div>
          </ActivityOption>

          <ActivityOption
            onClick={() => {
              setSelectedView('video')
            }}
          >
            <div className="h-20 rounded-lg m-0.5 flex flex-col items-center justify-end text-center bg-white hover:cursor-pointer">
              <Image
                unoptimized
                quality={100}
                alt="Video Page"
                src={VideoPageActivityImage}
              />
            </div>
            <div className="flex text-sm h-5 font-medium text-gray-500 items-center justify-center text-center">
              {t('dashboard.courses.structure.activity.types.video')}
            </div>
          </ActivityOption>

          <ActivityOption
            onClick={() => {
              setSelectedView('documentpdf')
            }}
          >
            <div className="h-20 rounded-lg m-0.5 flex flex-col items-center justify-end text-center bg-white hover:cursor-pointer">
              <Image
                unoptimized
                quality={100}
                alt="Document PDF Page"
                src={DocumentPdfPageActivityImage}
              />
            </div>
            <div className="flex text-sm h-5 font-medium text-gray-500 items-center justify-center text-center">
              {t('dashboard.courses.structure.activity.types.document')}
            </div>
          </ActivityOption>

          <ActivityOption
            onClick={() => {
              setSelectedView('assignments')
            }}
          >
            <div className="h-20 rounded-lg m-0.5 flex flex-col items-center justify-end text-center bg-white hover:cursor-pointer">
              <Image
                unoptimized
                quality={100}
                alt="Assignment Page"
                src={AssignmentActivityImage}
              />
            </div>
            <div className="flex text-sm h-5 font-medium text-gray-500 items-center justify-center text-center">
              {t('dashboard.courses.structure.activity.types.assignments')}
            </div>
          </ActivityOption>

          <ActivityOption
            onClick={() => {
              setSelectedView('peerreview')
            }}
          >
            <div className="h-20 rounded-lg m-0.5 flex flex-col items-center justify-end text-center bg-white hover:cursor-pointer">
              <Image
                height={70}
                unoptimized
                quality={100}
                alt="Peer Review Page"
                src={PeerReviewActivityImage}
              />
            </div>
            <div className="flex text-sm h-5 font-medium text-gray-500 items-center justify-center text-center">
              {t('dashboard.courses.structure.activity.types.peerreview')}
            </div>
          </ActivityOption>

          <ActivityOption
            onClick={createPracticeQuizActivity}
          >
            <div className="h-20 rounded-lg m-0.5 flex flex-col items-center justify-center text-center bg-white hover:cursor-pointer">
              <div className="text-3xl font-bold text-orange-500">Q</div>
            </div>
            <div className="flex text-sm h-5 font-medium text-gray-500 items-center justify-center text-center">
              Practice Quiz
            </div>
          </ActivityOption>
        </div>
      )}

      {selectedView === 'dynamic' && (
        <DynamicCanvaModal
          submitActivity={submitActivity}
          chapterId={chapterId}
          course={course}
        />
      )}

      {selectedView === 'video' && (
        <VideoModal
          submitFileActivity={submitFileActivity}
          submitExternalVideo={submitExternalVideo}
          chapterId={chapterId}
          course={course}
        />
      )}

      {selectedView === 'documentpdf' && (
        <DocumentPdfModal
          submitFileActivity={submitFileActivity}
          chapterId={chapterId}
          course={course}
        />
      )}

      {selectedView === 'assignments' && (
        <Assignment
          submitActivity={submitActivity}
          chapterId={chapterId}
          course={course}
          closeModal={closeModal}
        />
      )}

      {selectedView === 'peerreview' && (
        <PeerReviewActivityModal
          submitActivity={submitActivity}
          chapterId={chapterId}
          course={course}
          closeModal={closeModal}
        />
      )}
    </>
  )
}

const ActivityOption = ({ onClick, children }: any) => (
  <div
    onClick={onClick}
    className="w-full text-center rounded-xl bg-gray-100 border-4 border-gray-100 mx-auto hover:bg-gray-200 hover:border-gray-200 transition duration-200 ease-in-out cursor-pointer"
  >
    {children}
  </div>
)

export default NewActivityModal