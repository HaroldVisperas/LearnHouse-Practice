'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import useSWR, { mutate } from 'swr'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import FormLayout, {
  ButtonBlack,
  FormField,
  FormLabel,
  FormMessage,
  Input,
} from '@components/Objects/StyledElements/Form/Form'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import { updateActivity } from '@services/courses/activities'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const FILE_TYPE_OPTIONS = [
  'paragraph',
  'pdf',
  'docx',
  'xlsx',
  'pptx',
  'png',
  'jpg',
  'jpeg',
  'mp4',
]

export default function PeerReviewEditPage() {
  const params = useParams()
  const router = useRouter()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const orgslug = params?.orgslug as string
  const courseuuid = params?.courseuuid as string
  const activityid = params?.activityid as string

  const activityUrl = `${getAPIUrl()}activities/activity_${activityid}`

  const [references, setReferences] = React.useState<any[]>([])

  const { data: activity, isLoading } = useSWR(
    access_token ? activityUrl : null,
    (url) => swrFetcher(url, access_token)
  )

  const [name, setName] = React.useState('')
  const [instructions, setInstructions] = React.useState('')
  const [requiredReviewsPerSubmission, setRequiredReviewsPerSubmission] =
    React.useState('2')
  const [requiredReviewsPerStudent, setRequiredReviewsPerStudent] =
    React.useState('2')
  const [maxReviewsPerStudent, setMaxReviewsPerStudent] = React.useState('4')
  const [allowedTypes, setAllowedTypes] = React.useState<string[]>(['paragraph'])
  const [maxFiles, setMaxFiles] = React.useState('3')
  const [rubricCriteria, setRubricCriteria] = React.useState<any[]>([
    {
      id: 'criterion_1',
      title: 'Did the submission follow the instructions?',
      type: 'choice',
      options: [
        {
          id: 'option_a',
          label: 'A',
          text: 'Yes, they followed the submission well.',
          points: 5,
        },
        {
          id: 'option_b',
          label: 'B',
          text: 'Yes, but some of the instructions was not followed properly.',
          points: 3,
        },
        {
          id: 'option_c',
          label: 'C',
          text: 'No, they did not follow the instructions at all.',
          points: 0,
        },
      ]
    }
  ])
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (!activity) return

    setName(activity?.name || '')

    const instructionBlocks = Array.isArray(activity?.content?.instructions?.blocks)
      ? activity.content.instructions.blocks
      : []

    const instructionText = instructionBlocks
      .map((block: any) => {
        if (typeof block === 'string') return block
        if (block?.value) return block.value
        return ''
      })
      .filter(Boolean)
      .join('\n\n')

    setInstructions(instructionText)

    setRequiredReviewsPerSubmission(
      String(activity?.content?.review_rules?.required_reviews_per_submission ?? 2)
    )
    setRequiredReviewsPerStudent(
      String(activity?.content?.review_rules?.required_reviews_per_student ?? 2)
    )
    setMaxReviewsPerStudent(
      String(activity?.content?.review_rules?.max_reviews_per_student ?? 4)
    )

    setAllowedTypes(
      Array.isArray(activity?.content?.submission_settings?.allowed_types)
        ? activity.content.submission_settings.allowed_types
        : ['paragraph']
    )

    setMaxFiles(
      String(activity?.content?.submission_settings?.max_files ?? 3)
    )

    setRubricCriteria(
      Array.isArray(activity?.content?.rubric?.criteria) &&
        activity.content.rubric.criteria.length > 0
        ? activity.content.rubric.criteria
        : [
            {
              id: 'criterion_1',
              title: 'Did the submission follow the instructions?',
              type: 'choice',
              options: [
                {
                  id: 'option_a',
                  label: 'A',
                  text: 'Yes, they followed the submission well.',
                  points: 5,
                },
                {
                  id: 'option_b',
                  label: 'B',
                  text: 'Yes, but some of the instructions was not followed properly.',
                  points: 3,
                },
                {
                  id: 'option_c',
                  label: 'C',
                  text: 'No, they did not follow the instructions at all.',
                  points: 0,
                },
              ]
            }
          ]
    )
    setReferences(
      Array.isArray(activity?.content?.references)
        ? activity.content.references
        : []
    )
  }, [activity])

  const toggleAllowedType = (type: string) => {
    setAllowedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    )
  }

  const addRubricCriterion = () => {
    setRubricCriteria((prev) => [
      ...prev,
      {
        id: `criterion_${Date.now()}`,
        title: '',
        type: 'paragraph',
        options: [],
        min: 1,
        max: 10,
      },
    ])
  }

  const updateRubricCriterion = (id: string, key: string, value: any) => {
    setRubricCriteria((prev) =>
      prev.map((criterion) =>
        criterion.id === id ? { ...criterion, [key]: value } : criterion
      )
    )
  }

  const addChoiceOption = (criterionId: string) => {
    setRubricCriteria((prev) =>
      prev.map((criterion) => {
        if (criterion.id !== criterionId) return criterion

        const currentOptions = Array.isArray(criterion.options)
          ? criterion.options
          : []

        const nextIndex = currentOptions.length
        const nextLabel = String.fromCharCode(65 + nextIndex) // A, B, C, D...

        return {
          ...criterion,
          options: [
            ...currentOptions,
            {
              id: `option_${Date.now()}_${nextIndex}`,
              label: nextLabel,
              text: '',
              points: 0,
            },
          ],
        }
      })
    )
  }

  const updateChoiceOption = (
    criterionId: string,
    optionId: string,
    key: string,
    value: any
  ) => {
    setRubricCriteria((prev) =>
      prev.map((criterion) => {
        if (criterion.id !== criterionId) return criterion

        return {
          ...criterion,
          options: (criterion.options || []).map((option: any) =>
            option.id === optionId ? { ...option, [key]: value } : option
          ),
        }
      })
    )
  }

  const removeChoiceOption = (criterionId: string, optionId: string) => {
    setRubricCriteria((prev) =>
      prev.map((criterion) => {
        if (criterion.id !== criterionId) return criterion

        const filteredOptions = (criterion.options || []).filter(
          (option: any) => option.id !== optionId
        )

        const relabeledOptions = filteredOptions.map((option: any, index: number) => ({
          ...option,
          label: String.fromCharCode(65 + index),
        }))

        return {
          ...criterion,
          options: relabeledOptions,
        }
      })
    )
  }

  const removeRubricCriterion = (id: string) => {
    setRubricCriteria((prev) => prev.filter((criterion) => criterion.id !== id))
  }

  const addReference = () => {
    setReferences((prev) => [
      ...prev,
      {
        id: `reference_${Date.now()}`,
        type: 'text',
        value: '',
        url: '',
      },
    ])
  }

  const updateReference = (id: string, key: string, value: string) => {
    setReferences((prev) =>
      prev.map((reference) =>
        reference.id === id ? { ...reference, [key]: value } : reference
      )
    )
  }

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((reference) => reference.id !== id))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsSaving(true)

    const requiredSubmission = Number(requiredReviewsPerSubmission)
    const requiredStudent = Number(requiredReviewsPerStudent)
    const maxStudent = Number(maxReviewsPerStudent)
    const maxFilesValue = Number(maxFiles)

    if (requiredSubmission < 1 || requiredStudent < 1 || maxStudent < 1) {
      toast.error('All review counts must be at least 1.')
      setIsSaving(false)
      return
    }

    if (requiredStudent > maxStudent) {
      toast.error(
        'Required reviews per student cannot be greater than maximum reviews per student.'
      )
      setIsSaving(false)
      return
    }

    if (maxFilesValue < 1) {
      toast.error('Maximum files must be at least 1.')
      setIsSaving(false)
      return
    }

    if (allowedTypes.length === 0) {
      toast.error('Please select at least one allowed submission file type.')
      setIsSaving(false)
      return
    }

    const cleanedRubricCriteria = rubricCriteria
      .map((criterion) => {
        const cleanedTitle = criterion.title?.trim() || ''

        let cleanedOptions = criterion.options || []

        if (criterion.type === 'choice') {
          cleanedOptions = cleanedOptions
            .map((option: any, index: number) => {
              if (typeof option === 'string') {
                return {
                  id: `option_${criterion.id}_${index}`,
                  label: String.fromCharCode(65 + index),
                  text: option,
                  points: 0,
                }
              }

              return {
                id: option.id || `option_${criterion.id}_${index}`,
                label: option.label || String.fromCharCode(65 + index),
                text: option.text?.trim() || '',
                points: Number(option.points ?? 0),
              }
            })
            .filter((option: any) => option.text !== '')
        }

        return {
          ...criterion,
          title: cleanedTitle,
          options: cleanedOptions,
          min: Number(criterion.min ?? 1),
          max: Number(criterion.max ?? 10),
        }
      })
      .filter((criterion) => criterion.title !== '')

    try {
      await updateActivity(
        {
          ...activity,
          name,
          content: {
            tool: 'peer_review',
            instructions: {
              blocks: instructions.trim()
                ? [
                    {
                      type: 'paragraph',
                      value: instructions.trim(),
                    },
                  ]
                : [],
            },
            references: references
              .map((reference) => ({
                ...reference,
                value: reference.value?.trim() || '',
                url: reference.url?.trim() || '',
              }))
              .filter((reference) =>
                reference.type === 'text' || reference.type === 'paragraph'
                  ? reference.value !== ''
                  : reference.url !== ''
              ),
            submission_settings: {
              allowed_types: allowedTypes,
              max_files: maxFilesValue,
            },
            review_rules: {
              required_reviews_per_submission: requiredSubmission,
              required_reviews_per_student: requiredStudent,
              max_reviews_per_student: maxStudent,
            },
            rubric: {
              grading_mode: 'criteria',
              criteria:
                cleanedRubricCriteria.length > 0
                  ? cleanedRubricCriteria
                  : [
                      {
                        id: 'criterion_1',
                        title: 'Did the submission follow the instructions?',
                        type: 'choice',
                        options: [
                          {
                            id: 'option_a',
                            label: 'A',
                            text: 'Yes, they followed the submission well.',
                            points: 5,
                          },
                          {
                            id: 'option_b',
                            label: 'B',
                            text: 'Yes, but some of the instructions was not followed properly.',
                            points: 3,
                          },
                          {
                            id: 'option_c',
                            label: 'C',
                            text: 'No, they did not follow the instructions at all.',
                            points: 0,
                          },
                        ]
                      }
                    ],
            },
          },
        },
        activity.activity_uuid,
        access_token
      )

      await mutate(activityUrl)
      toast.success('Peer Review settings updated successfully.')
      router.push(
        getUriWithOrg(orgslug, '') + `/course/${courseuuid}/activity/${activityid}`
      )
      router.refresh()
    } catch (error) {
      console.error('Failed to update peer review activity:', error)
      toast.error('Failed to update Peer Review settings.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !activity) {
    return (
      <GeneralWrapperStyled>
        <div className="p-6">Loading...</div>
      </GeneralWrapperStyled>
    )
  }

  return (
    <GeneralWrapperStyled>
      <div className="max-w-3xl mx-auto pt-6 pb-20">
        <Link
          href={getUriWithOrg(orgslug, '') + `/dash/courses/course/${courseuuid}/content`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft size={16} />
          Back to activity
        </Link>

        <div className="bg-white nice-shadow rounded-xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Peer Review
          </h1>

          <FormLayout onSubmit={handleSubmit}>
            <FormField name="name">
              <div>
                <FormLabel>Activity Title</FormLabel>
                <FormMessage match="valueMissing">
                  Please enter a title.
                </FormMessage>
              </div>
              <Input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <FormField name="instructions">
              <div>
                <FormLabel>Instructions</FormLabel>
                <FormMessage match="valueMissing">
                  Please enter instructions.
                </FormMessage>
              </div>
              <textarea
                required
                className="w-full min-h-[140px] rounded-lg border border-gray-300 p-3 text-sm text-gray-700 outline-none focus:border-gray-500"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </FormField>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Allowed Submission File Types
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {FILE_TYPE_OPTIONS.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={allowedTypes.includes(type)}
                      onChange={() => toggleAllowedType(type)}
                    />
                    {type.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <FormField name="maxFiles">
              <div>
                <FormLabel>Maximum Files</FormLabel>
                <FormMessage match="valueMissing">
                  Please enter the maximum number of files.
                </FormMessage>
              </div>
              <Input
                required
                type="number"
                min="1"
                value={maxFiles}
                onChange={(e) => setMaxFiles(e.target.value)}
              />
            </FormField>

            <FormField name="requiredReviewsPerSubmission">
              <div>
                <FormLabel>Required Reviews per Submission</FormLabel>
                <FormMessage match="valueMissing">
                  Please enter how many reviews each submission must receive.
                </FormMessage>
              </div>
              <Input
                required
                type="number"
                min="1"
                value={requiredReviewsPerSubmission}
                onChange={(e) => setRequiredReviewsPerSubmission(e.target.value)}
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
                onChange={(e) => setRequiredReviewsPerStudent(e.target.value)}
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
                onChange={(e) => setMaxReviewsPerStudent(e.target.value)}
              />
            </FormField>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Reviewer Rubric
                </p>
                <button
                  type="button"
                  onClick={addRubricCriterion}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Add Criterion
                </button>
              </div>

              {rubricCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <Input
                    type="text"
                    placeholder="Criterion title"
                    value={criterion.title || ''}
                    onChange={(e) =>
                      updateRubricCriterion(
                        criterion.id,
                        'title',
                        e.target.value
                      )
                    }
                  />

                  <select
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                    value={criterion.type}
                    onChange={(e) =>
                      updateRubricCriterion(
                        criterion.id,
                        'type',
                        e.target.value
                      )
                    }
                  >
                    <option value="paragraph">Paragraph</option>
                    <option value="numeric">Numeric</option>
                    <option value="choice">Choice</option>
                  </select>

                  {criterion.type === 'choice' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Answer Options</p>
                        <button
                          type="button"
                          onClick={() => addChoiceOption(criterion.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Add Option
                        </button>
                      </div>

                      {Array.isArray(criterion.options) && criterion.options.length > 0 ? (
                        criterion.options.map((option: any) => (
                          <div
                            key={option.id}
                            className="rounded-lg border border-gray-200 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-700">
                                Option {option.label}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeChoiceOption(criterion.id, option.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>

                            <Input
                              type="text"
                              placeholder="Option description"
                              value={option.text || ''}
                              onChange={(e) =>
                                updateChoiceOption(
                                  criterion.id,
                                  option.id,
                                  'text',
                                  e.target.value
                                )
                              }
                            />

                            <Input
                              type="number"
                              placeholder="Points"
                              value={option.points ?? 0}
                              onChange={(e) =>
                                updateChoiceOption(
                                  criterion.id,
                                  option.id,
                                  'points',
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No options added yet.
                        </p>
                      )}
                    </div>
                  )}

                  {criterion.type === 'numeric' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Minimum</p>
                        <Input
                          type="number"
                          value={criterion.min ?? 1}
                          onChange={(e) =>
                            updateRubricCriterion(
                              criterion.id,
                              'min',
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Maximum</p>
                        <Input
                          type="number"
                          value={criterion.max ?? 10}
                          onChange={(e) =>
                            updateRubricCriterion(
                              criterion.id,
                              'max',
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeRubricCriterion(criterion.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Reference Materials
                  </p>
                  <button
                    type="button"
                    onClick={addReference}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Add Reference
                  </button>
                </div>

                {references.length === 0 ? (
                  <p className="text-sm text-gray-500">No references added yet.</p>
                ) : (
                  references.map((reference) => (
                    <div
                      key={reference.id}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <select
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                        value={reference.type}
                        onChange={(e) =>
                          updateReference(reference.id, 'type', e.target.value)
                        }
                      >
                        <option value="text">Text</option>
                        <option value="paragraph">Paragraph</option>
                        <option value="image">Image URL</option>
                        <option value="video">Video URL</option>
                        <option value="document">Document URL</option>
                      </select>

                      {(reference.type === 'text' || reference.type === 'paragraph') ? (
                        <textarea
                          className="w-full min-h-[100px] rounded-lg border border-gray-300 p-3 text-sm text-gray-700 outline-none focus:border-gray-500"
                          placeholder="Enter reference content..."
                          value={reference.value || ''}
                          onChange={(e) =>
                            updateReference(reference.id, 'value', e.target.value)
                          }
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder="Enter URL..."
                          value={reference.url || ''}
                          onChange={(e) =>
                            updateReference(reference.id, 'url', e.target.value)
                          }
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeReference(reference.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <ButtonBlack type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Peer Review Settings'}
            </ButtonBlack>
          </FormLayout>
        </div>
      </div>
    </GeneralWrapperStyled>
  )
}