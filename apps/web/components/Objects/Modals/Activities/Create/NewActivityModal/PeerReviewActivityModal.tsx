import React from 'react'
import FormLayout, {
  ButtonBlack,
  FormField,
  FormLabel,
  FormMessage,
  Input,
} from '@components/Objects/StyledElements/Form/Form'
import * as Form from '@radix-ui/react-form'
import { BarLoader } from 'react-spinners'

function PeerReviewActivityModal({
  submitActivity,
  chapterId,
  course,
  closeModal,
}: any) {
  const [activityName, setActivityName] = React.useState('')
  const [instructions, setInstructions] = React.useState('')
  const [requiredReviewsPerSubmission, setRequiredReviewsPerSubmission] = React.useState('2')
  const [requiredReviewsPerStudent, setRequiredReviewsPerStudent] = React.useState('2')
  const [maxReviewsPerStudent, setMaxReviewsPerStudent] = React.useState('4')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsSubmitting(true)

    const reqSubReviews = Number(requiredReviewsPerSubmission)
    const requiredReviews = Number(requiredReviewsPerStudent)
    const maxReviews = Number(maxReviewsPerStudent)

    if (reqSubReviews < 1 || requiredReviews < 1 || maxReviews < 1) {
      alert('All review counts must be at least 1.')
      setIsSubmitting(false)
      return
    }

    if (requiredReviews > maxReviews) {
      alert('Required reviews per student cannot be greater than maximum reviews per student.')
      setIsSubmitting(false)
      return
    }

    const activity = {
      name: activityName,
      chapter_id: chapterId,
      activity_type: 'TYPE_CUSTOM',
      activity_sub_type: 'SUBTYPE_CUSTOM_PEER_REVIEW',
      published: false,
      course_id: course?.courseStructure?.id,
      content: {
        tool: 'peer_review',
        instructions: instructions,
        submission_mode: 'text',
        required_reviews_per_submission: reqSubReviews,
        required_reviews_per_student: requiredReviews,
        max_reviews_per_student: maxReviews,
        anonymous_reviews: false,
      },
      details: {
        grading_mode: 'manual',
        allow_resubmission: false,
      },
    }

    await submitActivity(activity)
    setIsSubmitting(false)
  }

  return (
    <FormLayout onSubmit={handleSubmit}>
        <FormField name="name">
          <div>
            <FormLabel>Activity Title</FormLabel>
            <FormMessage match="valueMissing">Please enter a title.</FormMessage>
          </div>
          <Form.Control asChild>
            <Input
              required
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
            />
          </Form.Control>
        </FormField>

        <FormField name="instructions">
          <div>
            <FormLabel>Instructions</FormLabel>
            <FormMessage match="valueMissing">
              Please enter instructions.
            </FormMessage>
          </div>
          <Form.Control asChild>
            <Input
              required
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </Form.Control>
        </FormField>

        <FormField name="requiredReviewsSubmission">
          <div>
            <FormLabel>Required Reviews per Submission</FormLabel>
            <FormMessage match="valueMissing">
              Please enter the minimum reviews needed for each submission.
            </FormMessage>
          </div>
          <Input
            required
            type="number"
            min="1"
            value={requiredReviewsPerSubmission}
            onChange={(e)=>setRequiredReviewsPerSubmission(e.target.value)}
          />
        </FormField>

        <FormField name="requiredReviewsPerStudent">
          <div>
            <FormLabel>Required Reviews per Student</FormLabel>
            <FormMessage match="valueMissing">
              Please enter how many reviews each student must complete.
            </FormMessage>
          </div>
          <Input
            required
            type="number"
            min="1"
            value={requiredReviewsPerStudent}
            onChange={(e)=>setRequiredReviewsPerStudent(e.target.value)}
          />
        </FormField>

        <FormField name="maxReviewsPerStudent">
          <div>
            <FormLabel>Maximum Reviews per Student</FormLabel>
            <FormMessage match="valueMissing">
              Please enter the maximum reviews a student may complete.
            </FormMessage>
          </div>
          <Input
            required
            type="number"
            min="1"
            value={maxReviewsPerStudent}
            onChange={(e)=>setMaxReviewsPerStudent(e.target.value)}
          />
        </FormField>

        <Form.Submit asChild>
          <ButtonBlack type="submit" disabled={isSubmitting}>
            {isSubmitting ? <BarLoader color="#fff" width={100} /> : 'Create Peer Review'}
          </ButtonBlack>
        </Form.Submit>
    </FormLayout>
  )
}

export default PeerReviewActivityModal