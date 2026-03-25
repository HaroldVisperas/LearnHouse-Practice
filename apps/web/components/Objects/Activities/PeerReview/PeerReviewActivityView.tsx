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
}

export default function PeerReviewActivityView({
  activity,
}: PeerReviewActivityViewProps) {
  const session = useLHSession() as any

  const [submissionText, setSubmissionText] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const [isCheckingSubmission, setIsCheckingSubmission] = React.useState(true)

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

  const studentId =
    session?.data?.user?.user_uuid?.toString() ||
    session?.data?.user?.id?.toString() ||
    session?.data?.user?.user_id?.toString() ||
    session?.data?.user?.email?.toString() ||
    'student-demo'

  const requiredReviewsPerSubmission = Number(
    activity?.content?.required_reviews_per_submission || 1
  )
  const requiredReviewsPerStudent = Number(
    activity?.content?.required_reviews_per_student || 1
  )
  const maxReviewsPerStudent = Number(
    activity?.content?.max_reviews_per_student || 1
  )

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

      const receivedReviewCount = ownSubmissionItem?.reviews?.length || 0

      setIsActivityComplete(
        receivedReviewCount >= requiredReviewsPerSubmission
      )
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

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast.error('Please enter your submission first.')
      return
    }

    setIsSubmitting(true)

    try {
      await submitPeerSubmission({
        course_id: activity?.course_id?.toString() || 'course-1',
        activity_id: activity?.activity_uuid || 'activity-1',
        student_id: studentId,
        content: submissionText,
      })

      toast.success('Submission sent successfully.')
      setSubmissionText('')
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

    if (!reviewFeedbackText.trim()) {
      toast.error('Please enter feedback first.')
      return
    }

    setIsSubmittingReview(true)

    try {
      await submitPeerReview({
        activity_id: activity?.activity_uuid || 'activity-1',
        submission_id: currentReview.id,
        reviewer_id: studentId,
        feedback: reviewFeedbackText,
        required_reviews_per_submission: requiredReviewsPerSubmission,
        required_reviews_per_student: requiredReviewsPerStudent,
        max_reviews_per_student: maxReviewsPerStudent,
      })

      toast.success('Review submitted successfully.')
      setReviewFeedbackText('')
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
            {activity?.content?.instructions || 'No instructions provided.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Submission Mode
            </p>
            <p className="mt-2 text-gray-700">
              {activity?.content?.submission_mode || 'text'}
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
              Maximum Reviews per Student
            </p>
            <p className="mt-2 text-gray-700">
              {maxReviewsPerStudent}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Anonymous Reviews
            </p>
            <p className="mt-2 text-gray-700">
              {activity?.content?.anonymous_reviews ? 'Yes' : 'No'}
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
                  Activity Status
                </p>
                <p className="mt-2 text-gray-700">
                  {isActivityComplete
                    ? 'Completed'
                    : 'Waiting for required reviews on your submission'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  This activity will be considered complete once your submission receives{' '}
                  {requiredReviewsPerSubmission} review(s).
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Review Progress
                </p>
                <p className="mt-2 text-gray-700">
                  Completed reviews: {reviewProgress.completed_reviews} /{' '}
                  {reviewProgress.required_reviews_per_student} required
                </p>
                <p className="mt-1 text-gray-700">
                  Maximum allowed: {reviewProgress.max_reviews_per_student}
                </p>
                {reviewProgress.message ? (
                  <p className="mt-2 text-sm text-gray-600">
                    {reviewProgress.message}
                  </p>
                ) : null}
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

                    <textarea
                      className="mt-4 w-full min-h-[120px] rounded-lg border border-gray-300 p-4 text-sm text-gray-700 outline-none focus:border-gray-500"
                      placeholder="Write constructive feedback here..."
                      value={reviewFeedbackText}
                      onChange={(e) => setReviewFeedbackText(e.target.value)}
                    />

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
                    No review is available right now.
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
                          <div className="mt-2 space-y-2">
                            {item.reviews.map((review: any) => (
                              <div
                                key={review.review_id}
                                className="rounded-md bg-white p-3 text-sm text-gray-700 whitespace-pre-line"
                              >
                                {review.feedback}
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
              <h2 className="text-lg font-semibold text-gray-900">
                Submit your work
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter your response below and submit it for peer review.
              </p>

              <textarea
                className="mt-4 w-full min-h-[180px] rounded-lg border border-gray-300 p-4 text-sm text-gray-700 outline-none focus:border-gray-500"
                placeholder="Write your submission here..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
              />

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