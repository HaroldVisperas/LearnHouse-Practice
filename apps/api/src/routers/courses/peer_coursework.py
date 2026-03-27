from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel
from pathlib import Path
from uuid import uuid4
import shutil

from src.services.courses.peer_coursework import (
    submit_submission,
    get_submissions,
    get_next_review_for_student,
    submit_review,
    get_feedback_for_student,
)

router = APIRouter(prefix="/courses/peer-coursework", tags=["peer-coursework"])

UPLOAD_DIR = Path("storage/peer_review_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class SubmitSubmissionPayload(BaseModel):
    activity_id: str
    course_id: str
    student_id: str
    content: str = ""
    files: list = []


class NextReviewPayload(BaseModel):
    activity_id: str
    reviewer_id: str
    required_reviews_per_submission: int
    required_reviews_per_student: int
    max_reviews_per_student: int


class SubmitReviewPayload(BaseModel):
    activity_id: str
    submission_id: str
    reviewer_id: str
    feedback: str
    required_reviews_per_submission: int
    required_reviews_per_student: int
    max_reviews_per_student: int
    
@router.post("/upload")
async def upload_peer_review_file(
    file_object: UploadFile = File(...),
    activity_id: str = Form(...),
    student_id: str = Form(...),
):
    try:
        extension = Path(file_object.filename).suffix
        saved_name = f"{uuid4()}{extension}"
        target_path = UPLOAD_DIR / saved_name

        with target_path.open("wb") as buffer:
            shutil.copyfileobj(file_object.file, buffer)

        return {
            "success": True,
            "file": {
                "original_name": file_object.filename,
                "stored_name": saved_name,
                "content_type": file_object.content_type,
                "path": str(target_path).replace("\\", "/"),
                "activity_id": activity_id,
                "student_id": student_id,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submissions")
def create_submission(payload: SubmitSubmissionPayload):
    try:
        return submit_submission(
            activity_id=payload.activity_id,
            course_id=payload.course_id,
            student_id=payload.student_id,
            content=payload.content,
            files=payload.files,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/submissions")
def list_submissions(
    course_id: str = Query(...),
    activity_id: str | None = Query(None),
):
    return get_submissions(course_id, activity_id)


@router.post("/next-review")
def next_review(payload: NextReviewPayload):
    try:
        return get_next_review_for_student(
            activity_id=payload.activity_id,
            reviewer_id=payload.reviewer_id,
            required_reviews_per_submission=payload.required_reviews_per_submission,
            required_reviews_per_student=payload.required_reviews_per_student,
            max_reviews_per_student=payload.max_reviews_per_student,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/review-submit")
def create_review(payload: SubmitReviewPayload):
    try:
        return submit_review(
            activity_id=payload.activity_id,
            submission_id=payload.submission_id,
            reviewer_id=payload.reviewer_id,
            feedback=payload.feedback,
            required_reviews_per_submission=payload.required_reviews_per_submission,
            required_reviews_per_student=payload.required_reviews_per_student,
            max_reviews_per_student=payload.max_reviews_per_student,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/feedback")
def list_feedback(
    student_id: str = Query(...),
    activity_id: str | None = Query(None),
):
    return get_feedback_for_student(student_id, activity_id)