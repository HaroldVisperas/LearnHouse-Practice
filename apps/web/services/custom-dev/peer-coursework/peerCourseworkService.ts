const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function getPeerSubmissions(input: {
  course_id: string
  activity_id: string
}) {
  const res = await fetch(
    `${API_BASE}/api/v1/courses/peer-coursework/submissions?course_id=${input.course_id}&activity_id=${input.activity_id}`,
    {
      credentials: 'include',
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.detail || 'Failed to load submissions')
  }

  return res.json()
}

export async function submitPeerSubmission(input: {
  course_id: string
  activity_id: string
  student_id: string
  content: string
  files?: {
    name: string
    type: string
    size: number
  }[]
}) {
  const res = await fetch(
    `${API_BASE}/api/v1/courses/peer-coursework/submissions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || 'Failed to submit work')
  }

  return data
}

export async function uploadPeerSubmissionFile(
  file: File,
  activity_id: string,
  student_id: string
) {
  const formData = new FormData()
  formData.append('file_object', file)
  formData.append('activity_id', activity_id)
  formData.append('student_id', student_id)

  const res = await fetch(
    `${API_BASE}/api/v1/courses/peer-coursework/upload`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.detail || 'Failed to upload file')
  }

  return data
}

export async function getNextPeerReview(input: {
  activity_id: string
  reviewer_id: string
  required_reviews_per_submission: number
  required_reviews_per_student: number
  max_reviews_per_student: number
}) {
  const res = await fetch(
    `${API_BASE}/api/v1/courses/peer-coursework/next-review`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load next review')
  }

  return data
}

export async function submitPeerReview(input: {
  activity_id: string
  submission_id: string
  reviewer_id: string
  feedback: string
  required_reviews_per_submission: number
  required_reviews_per_student: number
  max_reviews_per_student: number
}) {
  const res = await fetch(
    `${API_BASE}/api/v1/courses/peer-coursework/review-submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || 'Failed to submit review')
  }

  return data
}

export async function getPeerFeedback(input: {
  student_id: string
  activity_id?: string
}) {
  const query = new URLSearchParams({
    student_id: input.student_id,
  })

  if (input.activity_id) {
    query.append('activity_id', input.activity_id)
  }

  const res = await fetch(
    `${API_BASE}/api/v1/courses/peer-coursework/feedback?${query.toString()}`,
    {
      credentials: 'include',
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.detail || 'Failed to load feedback')
  }

  return res.json()
}