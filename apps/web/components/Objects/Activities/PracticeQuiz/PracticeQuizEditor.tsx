'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

export interface PracticeQuizQuestion {
  question: string
  choices: string[]
  correctAnswerIndex: number
  explanationCorrect: string
  explanationWrong: string
  imageUrl?: string
}

interface PracticeQuizEditorProps {
  value: PracticeQuizQuestion[]
  onChange: (questions: PracticeQuizQuestion[]) => void
  onValidityChange?: (valid: boolean) => void
}

function createEmptyQuestion(): PracticeQuizQuestion {
  return {
    question: '',
    choices: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanationCorrect: '',
    explanationWrong: '',
    imageUrl: '',
  }
}

function validateQuestions(questions: PracticeQuizQuestion[]) {
  const errors: string[] = []

  if (questions.length === 0) {
    errors.push('At least one question is required.')
  }

  questions.forEach((q, index) => {
    const label = `Question ${index + 1}`

    if (!q.question.trim()) {
      errors.push(`${label} has no question text.`)
    }

    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`${label} must have exactly 4 choices.`)
    } else {
      q.choices.forEach((choice, choiceIndex) => {
        if (!choice.trim()) {
          errors.push(`${label} choice ${choiceIndex + 1} is empty.`)
        }
      })
    }

    if (
      typeof q.correctAnswerIndex !== 'number' ||
      q.correctAnswerIndex < 0 ||
      q.correctAnswerIndex > 3
    ) {
      errors.push(`${label} has an invalid correct answer.`)
    }

    if (!q.explanationCorrect.trim()) {
      errors.push(`${label} has no correct-answer explanation.`)
    }

    if (!q.explanationWrong.trim()) {
      errors.push(`${label} has no wrong-answer explanation.`)
    }
  })

  return errors
}

export default function PracticeQuizEditor({
  value,
  onChange,
  onValidityChange,
}: PracticeQuizEditorProps) {
  const questions = React.useMemo(() => value || [], [value])

  const validationErrors = React.useMemo(
    () => validateQuestions(questions),
    [questions]
  )

  const isValid = validationErrors.length === 0

  React.useEffect(() => {
    onValidityChange?.(isValid)
  }, [isValid, onValidityChange])

  const update = (newValue: PracticeQuizQuestion[]) => {
    onChange([...newValue])
  }

  const addQuestion = () => {
    update([...questions, createEmptyQuestion()])
  }

  const deleteQuestion = (questionIndex: number) => {
    update(questions.filter((_, index) => index !== questionIndex))
  }

  const updateQuestion = (
    questionIndex: number,
    patch: Partial<PracticeQuizQuestion>
  ) => {
    const copy = [...questions]
    copy[questionIndex] = {
      ...copy[questionIndex],
      ...patch,
    }
    update(copy)
  }

  const updateChoice = (
    questionIndex: number,
    choiceIndex: number,
    newValue: string
  ) => {
    const copy = [...questions]
    const choices = [...copy[questionIndex].choices]
    choices[choiceIndex] = newValue
    copy[questionIndex] = {
      ...copy[questionIndex],
      choices,
    }
    update(copy)
  }

  return (
    <div className="space-y-6">
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold mb-2">Cannot save yet</div>
          <ul className="list-disc pl-5 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Practice Quiz Questions
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Create lightweight review questions with instant feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Question
        </button>
      </div>

      {questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No questions yet. Add your first question to begin.
        </div>
      )}

      <div className="space-y-6">
        {questions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                  Question {questionIndex + 1}
                </div>
                <div className="text-base font-semibold text-neutral-900">
                  Practice Quiz Item
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteQuestion(questionIndex)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Question Text
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) =>
                    updateQuestion(questionIndex, {
                      question: e.target.value,
                    })
                  }
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    !question.question.trim()
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-neutral-300 focus:border-blue-500'
                  }`}
                  placeholder="Enter the question here"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700">
                  Choices
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex}>
                      <div className="mb-1 text-xs font-medium text-neutral-500">
                        Choice {choiceIndex + 1}
                      </div>
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) =>
                          updateChoice(questionIndex, choiceIndex, e.target.value)
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                          !choice.trim()
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-neutral-300 focus:border-blue-500'
                        }`}
                        placeholder={`Enter choice ${choiceIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Correct Answer
                </label>
                <select
                  value={question.correctAnswerIndex}
                  onChange={(e) =>
                    updateQuestion(questionIndex, {
                      correctAnswerIndex: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value={0}>Choice 1</option>
                  <option value={1}>Choice 2</option>
                  <option value={2}>Choice 3</option>
                  <option value={3}>Choice 4</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Correct Answer Explanation
                </label>
                <textarea
                  value={question.explanationCorrect}
                  onChange={(e) =>
                    updateQuestion(questionIndex, {
                      explanationCorrect: e.target.value,
                    })
                  }
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    !question.explanationCorrect.trim()
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-neutral-300 focus:border-blue-500'
                  }`}
                  placeholder="Explain why the correct answer is correct"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Wrong Answer Explanation
                </label>
                <textarea
                  value={question.explanationWrong}
                  onChange={(e) =>
                    updateQuestion(questionIndex, {
                      explanationWrong: e.target.value,
                    })
                  }
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    !question.explanationWrong.trim()
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-neutral-300 focus:border-blue-500'
                  }`}
                  placeholder="Explain why a wrong answer is wrong"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={question.imageUrl || ''}
                  onChange={(e) =>
                    updateQuestion(questionIndex, {
                      imageUrl: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Paste an image URL or leave blank"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Leave blank for fallback image behavior later.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}