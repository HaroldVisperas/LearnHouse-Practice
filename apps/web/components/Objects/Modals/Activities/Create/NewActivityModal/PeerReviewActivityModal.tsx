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
  const [reviewsPerStudent, setReviewsPerStudent] = React.useState('2')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsSubmitting(true)

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
        reviews_per_student: Number(reviewsPerStudent),
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

        <FormField name="reviewsPerStudent">
          <div>
            <FormLabel>Reviews per Student</FormLabel>
            <FormMessage match="valueMissing">
              Please enter the number of reviews.
            </FormMessage>
          </div>
          <Form.Control asChild>
            <Input
              required
              type="number"
              min="1"
              value={reviewsPerStudent}
              onChange={(e) => setReviewsPerStudent(e.target.value)}
            />
          </Form.Control>
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