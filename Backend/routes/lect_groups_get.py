from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db import get_db
from pydantic import BaseModel
from typing import List
from models import Lecturer, Group, StudyMaterial, Event, LecturerGroup
from utils.auth_utils import get_current_user 

router = APIRouter()
class GroupOut(BaseModel):
    id: int
    name: str


@router.get("/announcements")
def get_announcements(
    group_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"]
    user_id = current_user["id"]

    # Only lecturers allowed with explicit group_id
    if role != "lecturer":
        raise HTTPException(status_code=403, detail="Only lecturers can access this endpoint")

    # Check if lecturer is linked with this group
    link_exists = (
        db.query(LecturerGroup)
        .filter(
            LecturerGroup.lecturer_id == user_id,
            LecturerGroup.group_id == group_id
        )
        .first()
    )
    if not link_exists:
        raise HTTPException(status_code=403, detail="Lecturer not linked with this group")

    # Fetch study materials
    materials = (
        db.query(StudyMaterial, Lecturer, Group)
        .join(Lecturer, StudyMaterial.uploaded_by == Lecturer.lecturer_id)
        .join(Group, StudyMaterial.group_id == Group.group_id)
        .filter(StudyMaterial.group_id == group_id)
        .all()
    )

    # Fetch events
    events = (
        db.query(Event, Lecturer, Group)
        .join(Lecturer, Event.created_by == Lecturer.lecturer_id)
        .join(Group, Event.group_id == Group.group_id)
        .filter(Event.group_id == group_id)
        .all()
    )

    # Format response
    announcements = []
    for mat, lecturer, group in materials:
        announcements.append({
            "id": f"material-{mat.material_id}",
            "group_id": group.group_id,
            "title": mat.title,
            "content": mat.content,
            "type": "material",
            "uploader_id": mat.uploaded_by,
            "author": lecturer.name,
            "timestamp": mat.uploaded_at.isoformat(),
            "targetYear": group.year,
            "targetBranch": group.branch,
            "fileUrl": mat.file_url,
            "fileName": mat.file_name,
        })
    for ev, lecturer, group in events:
        announcements.append({
            "id": f"event-{ev.event_id}",
            "group_id": group.group_id,
            "title": ev.title,
            "content": ev.content,
            "type": "event",
            "uploader_id":ev.created_by,
            "author": lecturer.name,
            "timestamp": ev.created_at.isoformat(),
            "targetYear": group.year,
            "targetBranch": group.branch,
            "fileUrl": ev.file_url,
            "fileName": ev.file_name,
        })

    announcements.sort(key=lambda x: x["timestamp"], reverse=True)

    return announcements

@router.get("/groups/all", response_model=List[GroupOut])
def get_all_groups(db: Session = Depends(get_db),current_user: dict = Depends(get_current_user)):
    lecturer_id=current_user["id"]
    linked_groups=db.query(LecturerGroup).filter(
            LecturerGroup.lecturer_id == lecturer_id).all()
    if not linked_groups:
        raise HTTPException(status_code=403,detail="no groups assigned to the lecturers")
    group_ids=[lg.group_id for lg in linked_groups]
    # Fetch group names from the Group table
    groups = db.query(Group).filter(Group.group_id.in_(group_ids)).all()
    if not groups:
        raise HTTPException(status_code=404, detail="No groups found for this lecturer")
    # Return group_id + group_name
    return [{"id": g.group_id, "name": g.group_name} for g in groups]

@router.delete("/group-leave/{group_id}")
def leave_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    lecturer_id = current_user["id"]

    # Find the LecturerGroup link
    link = db.query(LecturerGroup).filter(
        LecturerGroup.lecturer_id == lecturer_id,
        LecturerGroup.group_id == group_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="You are not part of this group or group does not exist")

    # Delete the link
    db.delete(link)
    db.commit()

    return {"message": f"Successfully left the group with id {group_id}"}



