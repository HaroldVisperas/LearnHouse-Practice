'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { ButtonBlack } from '@components/Objects/StyledElements/Form/Form'
import toast from 'react-hot-toast'

export default function PeerReviewEditPage() {
  const params = useParams()

  const [requiredReviewsPerSubmission, setRequiredReviewsPerSubmission] = useState(2)
  const [requiredReviewsPerStudent, setRequiredReviewsPerStudent] = useState(2)
  const [maxReviewsPerStudent, setMaxReviewsPerStudent] = useState(3)

  const handleSave = async () => {
    try {
      // TODO: connect to updateActivity API
      toast.success('Peer Review settings saved!')
    } catch (err) {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl nice-shadow">
      <h1 className="text-xl font-bold mb-4">Edit Peer Review Settings</h1>

      <div className="space-y-4">
        <div>
          <label>Required Reviews per Submission</label>
          <input
            type="number"
            value={requiredReviewsPerSubmission}
            onChange={(e) => setRequiredReviewsPerSubmission(Number(e.target.value))}
          />
        </div>

        <div>
          <label>Required Reviews per Student</label>
          <input
            type="number"
            value={requiredReviewsPerStudent}
            onChange={(e) => setRequiredReviewsPerStudent(Number(e.target.value))}
          />
        </div>

        <div>
          <label>Max Reviews per Student</label>
          <input
            type="number"
            value={maxReviewsPerStudent}
            onChange={(e) => setMaxReviewsPerStudent(Number(e.target.value))}
          />
        </div>

        <ButtonBlack onClick={handleSave}>
          Save
        </ButtonBlack>
      </div>
    </div>
  )
}