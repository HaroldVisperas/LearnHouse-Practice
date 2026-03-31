'use client'
import { useCourse } from '@components/Contexts/CourseContext'
import NewActivityModal from '@components/Objects/Modals/Activities/Create/NewActivity'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import {
  createActivity,
  createExternalVideoActivity,
  createFileActivity,
} from '@services/courses/activities'
import { getOrganizationContextInfoWithoutCredentials } from '@services/organizations/orgs'
import { revalidateTags } from '@services/utils/ts/requests'
import { Layers } from 'lucide-react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { mutate } from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

type NewActivityButtonProps = {
  chapterId: string
  orgslug: string
}

function NewActivityButton(props: NewActivityButtonProps) {
  const { t } = useTranslation()
  const [newActivityModal, setNewActivityModal] = React.useState(false)
  const router = useRouter()
  const course = useCourse() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const withUnpublishedActivities = course ? course.withUnpublishedActivities : false

  const openNewActivityModal = async () => {
    setNewActivityModal(true)
  }

  const closeNewActivityModal = async () => {
    setNewActivityModal(false)
  }

  const extractCreatedActivityUuid = (created: any) => {
    console.log('Trying to extract activity UUID from:', created)

    return (
      created?.activity_uuid ||
      created?.data?.activity_uuid ||
      created?.data?.activity?.activity_uuid ||
      created?.activity?.activity_uuid ||
      created?.id ||
      null
    )
  }

  const submitActivity = async (activity: any) => {
    const org = await getOrganizationContextInfoWithoutCredentials(
      props.orgslug,
      { revalidate: 1800 }
    )

    const toast_loading = toast.loading(
      t('dashboard.courses.structure.activity.toasts.creating')
    )

    try {
      const createdActivity = await createActivity(
        activity,
        props.chapterId,
        org.id,
        access_token
      )

      console.log('createdActivity response:', createdActivity)
      console.log('createdActivity detail:', createdActivity?.detail)

      mutate(
        `${getAPIUrl()}courses/${course.courseStructure.course_uuid}/meta?with_unpublished_activities=${withUnpublishedActivities}`
      )
      mutate((key: string) => typeof key === 'string' && key.includes('/courses/org_slug/'))

      toast.dismiss(toast_loading)
      toast.success(t('dashboard.courses.structure.activity.toasts.create_success'))
      setNewActivityModal(false)

      await revalidateTags(['courses'], props.orgslug)

      const createdActivityUuid = extractCreatedActivityUuid(createdActivity)

      console.log('Extracted createdActivityUuid:', createdActivityUuid)
      console.log('Created activity subtype:', activity.activity_sub_type)

      const cleanCourseUuid = course.courseStructure.course_uuid.replace('course_', '')
      const cleanActivityUuid =
        typeof createdActivityUuid === 'string'
          ? createdActivityUuid.replace('activity_', '')
          : null

      if (
        activity.activity_sub_type === 'SUBTYPE_CUSTOM_PRACTICE_QUIZ' &&
        cleanActivityUuid
      ) {
        console.log(
          'Redirecting to practice quiz editor:',
          getUriWithOrg(
            props.orgslug,
            `/course/${cleanCourseUuid}/activity/${cleanActivityUuid}/practice-quiz/edit`
          )
        )

        router.push(
          getUriWithOrg(
            props.orgslug,
            `/course/${cleanCourseUuid}/activity/${cleanActivityUuid}/practice-quiz/edit`
          )
        )
        return
      }

      router.refresh()
    } catch (error) {
      toast.dismiss(toast_loading)
      toast.error(t('dashboard.courses.structure.activity.toasts.create_error'))
      console.error('Error creating activity:', error)
    }
  }

  const submitFileActivity = async (
    file: any,
    type: any,
    activity: any,
    chapterId: string
  ) => {
    toast.loading(t('dashboard.courses.structure.activity.toasts.uploading'))
    await createFileActivity(file, type, activity, chapterId, access_token)
    mutate(
      `${getAPIUrl()}courses/${course.courseStructure.course_uuid}/meta?with_unpublished_activities=${withUnpublishedActivities}`
    )
    mutate((key: string) => typeof key === 'string' && key.includes('/courses/org_slug/'))
    setNewActivityModal(false)
    toast.dismiss()
    toast.success(t('dashboard.courses.structure.activity.toasts.upload_success'))
    toast.success(t('dashboard.courses.structure.activity.toasts.create_success'))
    await revalidateTags(['courses'], props.orgslug)
    router.refresh()
  }

  const submitExternalVideo = async (
    external_video_data: any,
    activity: any,
    chapterId: string
  ) => {
    const toast_loading = toast.loading(
      t('dashboard.courses.structure.activity.toasts.creating_uploading')
    )
    await createExternalVideoActivity(
      external_video_data,
      activity,
      props.chapterId,
      access_token
    )
    mutate(
      `${getAPIUrl()}courses/${course.courseStructure.course_uuid}/meta?with_unpublished_activities=${withUnpublishedActivities}`
    )
    mutate((key: string) => typeof key === 'string' && key.includes('/courses/org_slug/'))
    setNewActivityModal(false)
    toast.dismiss(toast_loading)
    toast.success(t('dashboard.courses.structure.activity.toasts.create_success'))
    await revalidateTags(['courses'], props.orgslug)
    router.refresh()
  }

  useEffect(() => {}, [course])

  return (
    <div className="flex justify-center">
      <Modal
        isDialogOpen={newActivityModal}
        onOpenChange={setNewActivityModal}
        minHeight="no-min"
        minWidth="md"
        addDefCloseButton={false}
        dialogContent={
          <NewActivityModal
            closeModal={closeNewActivityModal}
            submitFileActivity={submitFileActivity}
            submitExternalVideo={submitExternalVideo}
            submitActivity={submitActivity}
            chapterId={props.chapterId}
            course={course}
          />
        }
        dialogTitle={t('dashboard.courses.structure.modals.new_activity.title')}
        dialogDescription={t('dashboard.courses.structure.modals.new_activity.description')}
      />
      <div
        onClick={() => {
          openNewActivityModal()
        }}
        className="flex w-44 h-10 items-center justify-center py-2 my-3 rounded-xl text-white bg-black hover:cursor-pointer"
      >
        <Layers size={17} />
        <div className="text-sm font-bold ml-2">
          {t('dashboard.courses.structure.actions.add_activity')}
        </div>
      </div>
    </div>
  )
}

export default NewActivityButton