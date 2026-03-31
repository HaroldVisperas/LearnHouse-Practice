'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface PracticeQuizQuestion {
  question: string
  choices: string[]
  correctAnswerIndex: number
  explanationCorrect: string
  explanationWrong: string
  imageUrl?: string
}

interface PracticeQuizActivityProps {
  activity?: {
    name?: string
    details?: {
      questions?: PracticeQuizQuestion[]
    }
  }
}

const FALLBACK_IMAGES = [
  '/empty_thumbnail.png',
  '/empty_thumbnail.png',
  '/empty_thumbnail.png',
]

const SAMPLE_QUESTIONS: PracticeQuizQuestion[] = [
  {
    question: 'What is the development board used in this activity?',
    choices: ['ESP 32', 'Arduino', 'Micro:bit', 'None of the above'],
    correctAnswerIndex: 0,
    explanationCorrect: 'The ESP 32 development board was used in this activity.',
    explanationWrong: 'It was not Arduino that was used in this activity.',
  },
  {
    question: 'Which option best describes the purpose of this lesson?',
    choices: [
      'Building a music-based coding activity',
      'Learning spreadsheet formulas',
      'Editing video chapters',
      'Setting up a database',
    ],
    correctAnswerIndex: 0,
    explanationCorrect: 'This lesson focuses on building a music-based coding activity.',
    explanationWrong: 'That is not the main focus of this lesson.',
  },
]

function getDisplayQuestions(activity?: PracticeQuizActivityProps['activity']) {
  if (activity?.details?.questions && activity.details.questions.length > 0) {
    return activity.details.questions
  }

  return SAMPLE_QUESTIONS
}

function getQuestionImage(question: PracticeQuizQuestion, index: number) {
  if (question.imageUrl) return question.imageUrl
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

export default function PracticeQuizActivity({
  activity,
}: PracticeQuizActivityProps) {
  const questions = React.useMemo(() => getDisplayQuestions(activity), [activity])

  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  const currentQuestion = questions[currentIndex]
  const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex

  const handleSubmit = () => {
    if (selectedIndex === null) return
    setSubmitted(true)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedIndex(null)
      setSubmitted(false)
    }
  }

  const handleTryAgain = () => {
    setSubmitted(false)
    setSelectedIndex(null)
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-[48%]">
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-neutral-200">
            <img
              src={getQuestionImage(currentQuestion, currentIndex)}
              alt="Practice quiz visual"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="w-full lg:w-[52%]">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-neutral-900 leading-tight">
              {currentQuestion.question}
            </h2>

            <div className="mt-8 space-y-5">
              {currentQuestion.choices.map((choice, index) => {
                const checked = selectedIndex === index

                return (
                  <label
                    key={`${choice}-${index}`}
                    className="flex items-center gap-4 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`practice-question-${currentIndex}`}
                      checked={checked}
                      onChange={() => setSelectedIndex(index)}
                      className="h-6 w-6"
                    />
                    <span className="text-2xl text-neutral-900">{choice}</span>
                  </label>
                )
              })}
            </div>

            <div className="mt-12 flex justify-center lg:justify-end">
              {!submitted ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={selectedIndex === null}
                  className={`min-w-[250px] rounded-2xl px-8 py-4 text-2xl font-medium transition ${
                    selectedIndex === null
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-300 text-neutral-900 hover:bg-neutral-400'
                  }`}
                >
                  Submit
                </button>
              ) : isCorrect ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className={`min-w-[250px] rounded-2xl px-8 py-4 text-2xl font-medium transition ${
                    currentIndex === questions.length - 1
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-300 text-neutral-900 hover:bg-neutral-400'
                  }`}
                >
                  {currentIndex === questions.length - 1 ? 'Finished' : 'Continue'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="min-w-[250px] rounded-2xl bg-neutral-300 px-8 py-4 text-2xl font-medium text-neutral-900 hover:bg-neutral-400 transition"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {submitted && (
        <div
          className={`mt-10 rounded-2xl px-8 py-6 flex items-center gap-6 ${
            isCorrect ? 'bg-neutral-200' : 'bg-neutral-200'
          }`}
        >
          <div className="shrink-0">
            {isCorrect ? (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-orange-500" />
            )}
          </div>

          <div>
            <div className="text-2xl font-semibold text-neutral-900">
              {isCorrect ? 'Correct! Good job!' : 'Wrong, you can do this!'}
            </div>
            <div className="mt-3 text-xl text-neutral-900">
              {isCorrect
                ? currentQuestion.explanationCorrect
                : currentQuestion.explanationWrong}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}