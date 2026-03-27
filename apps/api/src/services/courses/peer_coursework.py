from uuid import uuid4
from datetime import datetime

store = {
    "submissions": [],
    "reviews": [],
}


def submit_submission(
    activity_id: str,
    course_id: str,
    student_id: str,
    content: str = "",
    files: list | None = None,
):
    existing = next(
        (
            s
            for s in store["submissions"]
            if s["activity_id"] == activity_id and s["student_id"] == student_id
        ),
        None,
    )

    if existing:
        raise ValueError("You have already submitted for this activity.")
    
    files = files or []

    if not content.strip() and not files:
        raise ValueError("Submission content or files are required.")

    submission = {
        "id": str(uuid4()),
        "activity_id": activity_id,
        "course_id": course_id,
        "student_id": student_id,
        "content": content,
        "files": files,
        "created_at": datetime.utcnow().isoformat(),
    }

    store["submissions"].append(submission)
    return submission


def get_submissions(course_id: str, activity_id: str | None = None):
    submissions = [s for s in store["submissions"] if s["course_id"] == course_id]

    if activity_id:
        submissions = [s for s in submissions if s["activity_id"] == activity_id]

    return submissions


def get_completed_reviews_count(activity_id: str, reviewer_id: str):
    count = 0

    for review in store["reviews"]:
        if review["reviewer_id"] != reviewer_id:
            continue

        submission = next(
            (s for s in store["submissions"] if s["id"] == review["submission_id"]),
            None,
        )

        if not submission:
            continue

        if submission["activity_id"] != activity_id:
            continue

        if review["feedback"]:
            count += 1

    return count


def get_submission_review_count(submission_id: str):
    return len(
        [
            r
            for r in store["reviews"]
            if r["submission_id"] == submission_id and r["feedback"]
        ]
    )


def get_next_review_for_student(
    activity_id: str,
    reviewer_id: str,
    required_reviews_per_submission: int,
    required_reviews_per_student: int,
    max_reviews_per_student: int,
):
    completed_reviews = get_completed_reviews_count(activity_id, reviewer_id)

    if completed_reviews >= max_reviews_per_student:
        return {
            "status": "max_reached",
            "message": "You have reached the maximum number of reviews.",
            "completed_reviews": completed_reviews,
            "required_reviews_per_student": required_reviews_per_student,
            "max_reviews_per_student": max_reviews_per_student,
            "submission": None,
        }

    submissions = [s for s in store["submissions"] if s["activity_id"] == activity_id]

    for submission in submissions:
        # cannot review own submission
        if submission["student_id"] == reviewer_id:
            continue

        # skip if reviewer already reviewed this submission
        existing_review = next(
            (
                r
                for r in store["reviews"]
                if r["submission_id"] == submission["id"]
                and r["reviewer_id"] == reviewer_id
            ),
            None,
        )
        if existing_review:
            continue

        # skip if submission already has enough completed reviews
        completed_for_submission = get_submission_review_count(submission["id"])
        if completed_for_submission >= required_reviews_per_submission:
            continue

        return {
            "status": "available",
            "message": "Next review found.",
            "completed_reviews": completed_reviews,
            "required_reviews_per_student": required_reviews_per_student,
            "max_reviews_per_student": max_reviews_per_student,
            "submission": submission,
        }

    return {
        "status": "none_available",
        "message": "No eligible submissions are available right now.",
        "completed_reviews": completed_reviews,
        "required_reviews_per_student": required_reviews_per_student,
        "max_reviews_per_student": max_reviews_per_student,
        "submission": None,
    }


def submit_review(
    activity_id: str,
    submission_id: str,
    reviewer_id: str,
    feedback: str,
    required_reviews_per_submission: int,
    required_reviews_per_student: int,
    max_reviews_per_student: int,
):
    if not feedback.strip():
        raise ValueError("Feedback is required.")

    submission = next((s for s in store["submissions"] if s["id"] == submission_id), None)
    if not submission:
        raise ValueError("Submission not found.")

    if submission["activity_id"] != activity_id:
        raise ValueError("Submission does not belong to this activity.")

    if submission["student_id"] == reviewer_id:
        raise ValueError("You cannot review your own submission.")

    existing_review = next(
        (
            r
            for r in store["reviews"]
            if r["submission_id"] == submission_id and r["reviewer_id"] == reviewer_id
        ),
        None,
    )

    if existing_review and existing_review["feedback"]:
        raise ValueError("You have already reviewed this submission.")

    completed_reviews = get_completed_reviews_count(activity_id, reviewer_id)
    if completed_reviews >= max_reviews_per_student:
        raise ValueError("You have reached the maximum number of reviews.")

    completed_for_submission = get_submission_review_count(submission_id)
    if completed_for_submission >= required_reviews_per_submission:
        raise ValueError("This submission already has enough reviews.")

    if existing_review:
        existing_review["feedback"] = feedback
        return existing_review

    review = {
        "id": str(uuid4()),
        "submission_id": submission_id,
        "reviewer_id": reviewer_id,
        "feedback": feedback,
        "created_at": datetime.utcnow().isoformat(),
    }

    store["reviews"].append(review)
    return review


def get_feedback_for_student(student_id: str, activity_id: str | None = None):
    student_submissions = [s for s in store["submissions"] if s["student_id"] == student_id]

    if activity_id:
        student_submissions = [s for s in student_submissions if s["activity_id"] == activity_id]

    result = []

    for submission in student_submissions:
        reviews = [
            {
                "review_id": r["id"],
                "reviewer_id": r["reviewer_id"],
                "feedback": r["feedback"],
                "created_at": r["created_at"],
            }
            for r in store["reviews"]
            if r["submission_id"] == submission["id"] and r["feedback"]
        ]

        result.append(
            {
                "submission": submission,
                "reviews": reviews,
            }
        )

    return result