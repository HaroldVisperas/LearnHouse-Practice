'use client'

import React from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { ButtonBlack } from '@components/Objects/StyledElements/Form/Form'
import toast from 'react-hot-toast'
import { BarLoader } from 'react-spinners'
import {
  getNextPeerReview,
  getPeerFeedback,
  getPeerSubmissions,
  submitPeerReview,
  submitPeerSubmission,
} from '@services/custom-dev/peer-coursework/peerCourseworkService'

type PeerReviewActivityViewProps = {
  activity: any
  onMarkComplete?: () => Promise<void>
  onUnmarkComplete?: () => Promise<void>
  trailData?: any
}

function formatReviewFeedback(feedback: string): string[] {
  if (!feedback) return []
  return feedback
    .split('\n\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function renderBlocks(blocks: any): string {
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map((block) => {
      if (typeof block === 'string') return block
      if (block?.value) return block.value
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export default function PeerReviewActivityView({
  activity,
  onMarkComplete,
  onUnmarkComplete,
  trailData,
}: PeerReviewActivityViewProps) {
  const session = useLHSession() as any

  const [submissionText, setSubmissionText] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const [isCheckingSubmission, setIsCheckingSubmission] = React.useState(true)

  const [hasSyncedCompletion, setHasSyncedCompletion] = React.useState(false)

  const [currentReview, setCurrentReview] = React.useState<any>(null)
  const [reviewFeedbackText, setReviewFeedbackText] = React.useState('')
  const [isLoadingNextReview, setIsLoadingNextReview] = React.useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false)
  const [reviewProgress, setReviewProgress] = React.useState({
    completed_reviews: 0,
    required_reviews_per_student: 0,
    max_reviews_per_student: 0,
    status: '',
    message: '',
  })
  const [receivedFeedback, setReceivedFeedback] = React.useState<any[]>([])
  const [receivedReviewCount, setReceivedReviewCount] = React.useState(0)

  const studentId =
    session?.data?.user?.user_uuid?.toString() ||
    session?.data?.user?.id?.toString() ||
    session?.data?.user?.user_id?.toString() ||
    session?.data?.user?.email?.toString() ||
    'student-demo'

    const peerReviewContent = activity?.content || {}

  const instructionBlocks = Array.isArray(peerReviewContent?.instructions?.blocks)
    ? peerReviewContent.instructions.blocks
    : []

  const instructionsText =
    instructionBlocks
      .map((block: any) => {
        if (typeof block === 'string') return block
        if (block?.value) return block.value
        return ''
      })
      .filter(Boolean)
      .join('\n\n') || 'No instructions provided.'

  const reviewRules = peerReviewContent?.review_rules || {}
  const submissionSettings = peerReviewContent?.submission_settings || {}
  const rubric = peerReviewContent?.rubric || {}

  const requiredReviewsPerSubmission = Number(
    reviewRules?.required_reviews_per_submission || 1
  )
  const requiredReviewsPerStudent = Number(
    reviewRules?.required_reviews_per_student || 1
  )
  const maxReviewsPerStudent = Number(
    reviewRules?.max_reviews_per_student || 1
  )

  const allowedSubmissionTypes = Array.isArray(submissionSettings?.allowed_types)
    ? submissionSettings.allowed_types
    : []

  const maxFiles = Number(submissionSettings?.max_files || 1)

  const loadReceivedFeedback = async () => {
    try {
      const res = await getPeerFeedback({
        student_id: studentId,
        activity_id: activity?.activity_uuid,
      })

      const feedbackItems = Array.isArray(res) ? res : res?.feedback || []
      setReceivedFeedback(feedbackItems)

      const ownSubmissionItem = feedbackItems.find(
        (item: any) =>
          String(item?.submission?.student_id) === String(studentId) &&
          String(item?.submission?.activity_id) === String(activity?.activity_uuid)
      )

      const reviewCount = ownSubmissionItem?.reviews?.length || 0
      setReceivedReviewCount(reviewCount)
    } catch (error) {
      console.error('Failed to load received feedback:', error)
    }
  }

  const loadNextReview = async () => {
    setIsLoadingNextReview(true)

    try {
      const res = await getNextPeerReview({
        activity_id: activity?.activity_uuid || 'activity-1',
        reviewer_id: studentId,
        required_reviews_per_submission: requiredReviewsPerSubmission,
        required_reviews_per_student: requiredReviewsPerStudent,
        max_reviews_per_student: maxReviewsPerStudent,
      })

      setCurrentReview(res?.submission || null)
      setReviewProgress({
        completed_reviews: res?.completed_reviews || 0,
        required_reviews_per_student:
          res?.required_reviews_per_student || requiredReviewsPerStudent,
        max_reviews_per_student:
          res?.max_reviews_per_student || maxReviewsPerStudent,
        status: res?.status || '',
        message: res?.message || '',
      })
    } catch (error) {
      console.error('Failed to load next review:', error)
      setCurrentReview(null)
    } finally {
      setIsLoadingNextReview(false)
    }
  }

  const [isActivityComplete, setIsActivityComplete] = React.useState(false)

  const allowsParagraphSubmission = allowedSubmissionTypes.includes('paragraph')

  const rubricCriteria = Array.isArray(rubric?.criteria) ? rubric.criteria : []

  const [rubricResponses, setRubricResponses] = React.useState<Record<string, any>>({})

  const references = Array.isArray(peerReviewContent?.references)
    ? peerReviewContent.references
    : []

  const updateRubricResponse = (criterionId: string, value: any) => {
    setRubricResponses((prev) => ({
      ...prev,
      [criterionId]: value,
    }))
  }

  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])

  const allowsFileSubmission = allowedSubmissionTypes.some((type: string) =>
    ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg', 'mp4'].includes(type)
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} file(s).`)
      return
    }

    setSelectedFiles(files)
  }

  const acceptedFileTypes = allowedSubmissionTypes
    .filter((type: string) => type !== 'paragraph')
    .map((type: string) => `.${type}`)
    .join(',')

  React.useEffect(() => {
    const checkSubmission = async () => {
      try {
        const res = await getPeerSubmissions({
          course_id: activity?.course_id?.toString() || 'course-1',
          activity_id: activity?.activity_uuid || 'activity-1',
        })

        const submissions = Array.isArray(res) ? res : res?.submissions || []

        const alreadySubmitted = submissions.some(
          (submission: any) =>
            String(submission.student_id) === String(studentId) &&
            String(submission.activity_id) === String(activity?.activity_uuid)
        )

        setHasSubmitted(alreadySubmitted)

        if (alreadySubmitted) {
          await loadNextReview()
          await loadReceivedFeedback()
        }
      } catch (error) {
        console.error('Failed to check submissions:', error)
      } finally {
        setIsCheckingSubmission(false)
      }
    }

    if (activity?.activity_uuid) {
      checkSubmission()
    }
  }, [activity, studentId])

  React.useEffect(() => {
    if (!trailData || !activity?.id) return

    const run = trailData?.runs?.find((run: any) =>
      run?.steps?.some((step: any) => step.activity_id === activity.id)
    )

    const completedStep = run?.steps?.find(
      (step: any) => step.activity_id === activity.id && step.complete === true
    )

    setHasSyncedCompletion(!!completedStep)
  }, [trailData, activity])

  React.useEffect(() => {
    let cancelled = false

    const syncCompletion = async () => {
      if (!onMarkComplete || !onUnmarkComplete) return

      try {
        if (isActivityComplete && !hasSyncedCompletion) {
          await onMarkComplete()
          if (!cancelled) {
            setHasSyncedCompletion(true)
          }
        } else if (!isActivityComplete && hasSyncedCompletion) {
          await onUnmarkComplete()
          if (!cancelled) {
            setHasSyncedCompletion(false)
          }
        }
      } catch (error) {
        console.error('Failed to sync peer review completion:', error)
      }
    }

    syncCompletion()

    return () => {
      cancelled = true
    }
  }, [isActivityComplete, hasSyncedCompletion, onMarkComplete, onUnmarkComplete])

  React.useEffect(() => {
    const hasEnoughReviewsOnOwnSubmission =
      receivedReviewCount >= requiredReviewsPerSubmission

    const hasCompletedRequiredReviewsForOthers =
      reviewProgress.completed_reviews >= requiredReviewsPerStudent

    setIsActivityComplete(
      hasSubmitted &&
        hasEnoughReviewsOnOwnSubmission &&
        hasCompletedRequiredReviewsForOthers
    )
  }, [
    hasSubmitted,
    receivedReviewCount,
    reviewProgress.completed_reviews,
    requiredReviewsPerSubmission,
    requiredReviewsPerStudent,
  ])

  const handleSubmit = async () => {
    const hasParagraphContent = submissionText.trim().length > 0
    const hasFiles = selectedFiles.length > 0

    if (allowsParagraphSubmission && allowsFileSubmission) {
      if (!hasParagraphContent && !hasFiles) {
        toast.error('Please provide a written response or upload at least one file.')
        return
      }
    } else if (allowsParagraphSubmission) {
      if (!hasParagraphContent) {
        toast.error('Please enter your submission first.')
        return
      }
    } else if (allowsFileSubmission) {
      if (!hasFiles) {
        toast.error('Please upload at least one file.')
        return
      }
    } else {
      toast.error('No submission type is enabled for this activity.')
      return
    }

    const composedSubmissionContent = [
      submissionText.trim()
        ? `Written Response:\n${submissionText.trim()}`
        : '',
      selectedFiles.length > 0
        ? `Uploaded Files:\n${selectedFiles.map((file) => `- ${file.name}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    setIsSubmitting(true)

    try {
      await submitPeerSubmission({
        course_id: activity?.course_id?.toString() || 'course-1',
        activity_id: activity?.activity_uuid || 'activity-1',
        student_id: studentId,
        content: composedSubmissionContent,
      })

      toast.success('Submission sent successfully.')
        setSubmissionText('')
        setSelectedFiles([])
        setHasSubmitted(true)
        await loadNextReview()
        await loadReceivedFeedback()
    } catch (error: any) {
        console.error('Peer review submission failed:', error)
        toast.error(error?.message || 'Failed to submit peer review work.')
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!currentReview?.id) {
      toast.error('No review is currently available.')
      return
    }

    if (rubricCriteria.length > 0) {
      const hasMissingResponse = rubricCriteria.some((criterion: any) => {
        const value = rubricResponses[criterion.id]
        return value === undefined || value === null || String(value).trim() === ''
      })

      if (hasMissingResponse) {
        toast.error('Please complete all rubric fields first.')
        return
      }
    } else {
      if (!reviewFeedbackText.trim()) {
        toast.error('Please enter feedback first.')
        return
      }
    }

    setIsSubmittingReview(true)

    const formattedFeedback =
      rubricCriteria.length > 0
        ? rubricCriteria
            .map((criterion: any) => {
              const rawValue = rubricResponses[criterion.id] ?? ''

              if (criterion.type === 'choice') {
                const selectedOption = (criterion.options || []).find(
                  (option: any) => option.id === rawValue
                )

                return `${criterion.title}: ${
                  selectedOption
                    ? `${selectedOption.label}. ${selectedOption.text}`
                    : rawValue
                }`
              }

              return `${criterion.title}: ${rawValue}`
            })
            .join('\n\n')
        : reviewFeedbackText

    try {
      await submitPeerReview({
        activity_id: activity?.activity_uuid || 'activity-1',
        submission_id: currentReview.id,
        reviewer_id: studentId,
        feedback: formattedFeedback,
        required_reviews_per_submission: requiredReviewsPerSubmission,
        required_reviews_per_student: requiredReviewsPerStudent,
        max_reviews_per_student: maxReviewsPerStudent,
      })

      toast.success('Review submitted successfully.')
      setReviewFeedbackText('')
      setRubricResponses({})
      await loadNextReview()
      await loadReceivedFeedback()
    } catch (error: any) {
      console.error('Failed to submit review:', error)
      toast.error(error?.message || 'Failed to submit review.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isCheckingSubmission) {
    return (
      <div className="bg-white nice-shadow rounded-xl p-6 md:p-8 max-w-4xl mx-auto w-full">
        <p className="text-sm text-gray-600">Checking submission status...</p>
      </div>
    )
  }

  return (
    <div className="bg-white nice-shadow rounded-xl p-6 md:p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900">{activity?.name}</h1>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Instructions
          </p>
          <p className="mt-2 text-gray-700 whitespace-pre-line">
            {renderBlocks(activity?.content?.instructions?.blocks) || 'No instructions provided.'}
          </p>
        </div>

        {references.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Reference Materials
            </p>

            <div className="mt-3 space-y-3">
              {references.map((reference: any, index: number) => (
                <div
                  key={reference.id || index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  {(reference.type === 'text' || reference.type === 'paragraph') && (
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {reference.value}
                    </p>
                  )}

                  {reference.type === 'image' && reference.url && (
                    <img
                      src={reference.url}
                      alt="Reference"
                      className="max-h-64 rounded-lg object-contain"
                    />
                  )}

                  {reference.type === 'video' && reference.url && (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Open video reference
                    </a>
                  )}

                  {reference.type === 'document' && reference.url && (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Open document reference
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Allowed Submission Types
            </p>
            <p className="mt-2 text-gray-700">
              {allowedSubmissionTypes.length > 0
                ? allowedSubmissionTypes.join(', ')
                : 'No file types configured.'}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Required Reviews per Submission
            </p>
            <p className="mt-2 text-gray-700">
              {requiredReviewsPerSubmission}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Required Reviews per Student
            </p>
            <p className="mt-2 text-gray-700">
              {requiredReviewsPerStudent}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Maximum Files
            </p>
            <p className="mt-2 text-gray-700">
              {maxFiles}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          {hasSubmitted ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900">
                Submission received
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You have already submitted for this activity.
              </p>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Review Progress
                </p>
                <p className="mt-2 text-gray-700">
                  Reviews you completed for others: {reviewProgress.completed_reviews} / {requiredReviewsPerStudent} (Required) - {reviewProgress.max_reviews_per_student} (Maximum)
                </p>
                <p className="mt-1 text-gray-700">
                  Reviews received on your submission: {receivedReviewCount} / {requiredReviewsPerSubmission} (Required)
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 md:col-span-2">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Reviewer Rubric
                </p>
                <p className="mt-2 text-gray-700">
                  {Array.isArray(rubric?.criteria) && rubric.criteria.length > 0
                    ? `${rubric.criteria.length} criterion/criteria configured`
                    : 'No rubric criteria configured.'}
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Current review
                </h3>

                {isLoadingNextReview ? (
                  <p className="mt-3 text-sm text-gray-600">
                    Loading next review...
                  </p>
                ) : currentReview ? (
                  <>
                    <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-line">
                      {currentReview.content}
                    </div>

                    <div className="mt-4 space-y-4">
                      {rubricCriteria.length > 0 ? (
                        rubricCriteria.map((criterion: any) => (
                          <div
                            key={criterion.id}
                            className="rounded-lg border border-gray-200 p-4 bg-white"
                          >
                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              {criterion.title}
                            </p>

                            {criterion.type === 'paragraph' && (
                              <textarea
                                className="w-full min-h-[120px] rounded-lg border border-gray-300 p-4 text-sm text-gray-700 outline-none focus:border-gray-500"
                                placeholder="Write your feedback here..."
                                value={rubricResponses[criterion.id] || ''}
                                onChange={(e) =>
                                  updateRubricResponse(criterion.id, e.target.value)
                                }
                              />
                            )}

                            {criterion.type === 'numeric' && (
                              <input
                                type="number"
                                min={criterion.min ?? 1}
                                max={criterion.max ?? 10}
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 outline-none focus:border-gray-500"
                                value={rubricResponses[criterion.id] || ''}
                                onChange={(e) =>
                                  updateRubricResponse(criterion.id, e.target.value)
                                }
                              />
                            )}

                            {criterion.type === 'choice' && (
                              <div className="space-y-2">
                                {(criterion.options || []).map((option: any) => (
                                  <label
                                    key={option.id}
                                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                                  >
                                    <input
                                      type="radio"
                                      name={`criterion_${criterion.id}`}
                                      value={option.id}
                                      checked={rubricResponses[criterion.id] === option.id}
                                      onChange={() =>
                                        updateRubricResponse(criterion.id, option.id)
                                      }
                                      className="mt-1"
                                    />
                                    <div className="text-sm text-gray-700">
                                      <span className="font-semibold">{option.label}.</span>{' '}
                                      <span>{option.text}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <textarea
                          className="w-full min-h-[120px] rounded-lg border border-gray-300 p-4 text-sm text-gray-700 outline-none focus:border-gray-500"
                          placeholder="Write constructive feedback here..."
                          value={reviewFeedbackText}
                          onChange={(e) => setReviewFeedbackText(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="mt-4">
                      <ButtonBlack
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                      >
                        {isSubmittingReview ? (
                          <BarLoader color="#fff" width={100} />
                        ) : (
                          'Submit Review'
                        )}
                      </ButtonBlack>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-gray-600">
                    No eligible submissions are available right now.
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Feedback received on your submission
                </h3>

                {receivedFeedback.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">
                    No feedback has been received yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {receivedFeedback.map((item: any, index: number) => (
                      <div
                        key={item?.submission?.id || index}
                        className="rounded-md border border-gray-200 bg-gray-50 p-4"
                      >
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          Your submission
                        </p>
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                          {item?.submission?.content}
                        </div>

                        <p className="mt-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          Reviews
                        </p>

                        {item?.reviews?.length ? (
                          <div className="mt-2 space-y-3">
                            {item.reviews.map((review: any) => (
                              <div
                                key={review.review_id}
                                className="rounded-md bg-white p-3 text-sm text-gray-700"
                              >
                                <div className="space-y-2">
                                  {formatReviewFeedback(review.feedback).map((line, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded-sm border border-gray-100 bg-gray-50 px-3 py-2"
                                    >
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-gray-600">
                            No completed reviews yet.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-4 space-y-4">
                {allowsParagraphSubmission && (
                  <textarea
                    className="w-full min-h-[180px] rounded-lg border border-gray-300 p-4 text-sm text-gray-700 outline-none focus:border-gray-500"
                    placeholder="Write your submission here..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                  />
                )}

                {allowsFileSubmission && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Upload files ({allowedSubmissionTypes.filter((type: string) => type !== 'paragraph').join(', ')})
                    </p>

                    <input
                      type="file"
                      multiple={maxFiles > 1}
                      accept={acceptedFileTypes}
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-700"
                    />

                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!allowsParagraphSubmission && !allowsFileSubmission && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                    No submission type is enabled for this activity yet.
                  </div>
                )}
              </div>

              <div className="mt-4">
                <ButtonBlack
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <BarLoader color="#fff" width={100} />
                  ) : (
                    'Submit for Peer Review'
                  )}
                </ButtonBlack>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}