"""ClimateWise learning API (first working prototype).

Run from this directory with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "climatewise.db"

app = FastAPI(
    title="ClimateWise API",
    description="Backend for the ClimateWise climate education mobile app.",
    version="0.1.0",
)

# Development setting: wide CORS makes local Expo testing easier. Tighten this before deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def init_db() -> None:
    """Create the tables and add starter educational content the first time the API runs."""
    with closing(get_connection()) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS lessons (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT NOT NULL,
                estimated_minutes INTEGER NOT NULL,
                category TEXT NOT NULL,
                summary TEXT NOT NULL,
                sections_json TEXT NOT NULL,
                sort_order INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS quiz_questions (
                id INTEGER PRIMARY KEY,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id),
                prompt TEXT NOT NULL,
                options_json TEXT NOT NULL,
                correct_index INTEGER NOT NULL,
                explanation TEXT NOT NULL,
                sort_order INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                learner_id TEXT NOT NULL,
                question_id INTEGER NOT NULL REFERENCES quiz_questions(id),
                selected_index INTEGER NOT NULL,
                is_correct INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS lesson_completions (
                learner_id TEXT NOT NULL,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id),
                completed_at TEXT NOT NULL,
                PRIMARY KEY (learner_id, lesson_id)
            );
            """
        )

        lesson_count = connection.execute("SELECT COUNT(*) AS n FROM lessons").fetchone()["n"]
        if lesson_count == 0:
            lessons = [
                (
                    1, "What Is Climate Change?", "Start with the basics", 6, "Basics",
                    "Understand the difference between weather and climate, and what it means when the climate changes.",
                    [
                        {"heading": "Weather and climate are different", "body": "Weather describes conditions over a short time, such as today's rain or sunshine. Climate describes the usual patterns of weather in a place over many years."},
                        {"heading": "What is climate change?", "body": "Climate change means long-term changes in temperatures and weather patterns. Some changes happen naturally, but the rapid warming observed today is mainly driven by human activities."},
                        {"heading": "Why should we care?", "body": "Climate change can affect heat, rainfall, ecosystems, food and water systems, homes and communities. Its effects vary by place, and the level of future harm depends partly on how much warming occurs and how societies prepare."},
                    ],
                    1,
                ),
                (
                    2, "Greenhouse Gases", "Earth's heat-trapping gases", 7, "Science",
                    "Learn how greenhouse gases warm Earth and why adding more of them changes the balance.",
                    [
                        {"heading": "A natural process", "body": "Greenhouse gases absorb and re-emit some of the heat leaving Earth's surface. This natural greenhouse effect makes Earth warm enough for life as we know it."},
                        {"heading": "When the balance changes", "body": "Human activities add extra greenhouse gases, including carbon dioxide and methane. This strengthens the greenhouse effect and causes additional warming."},
                    ],
                    2,
                ),
                (
                    3, "Human Activities", "How our choices affect emissions", 8, "Causes",
                    "Explore how energy, transport, industry and land use contribute to greenhouse-gas emissions.",
                    [
                        {"heading": "Burning fossil fuels", "body": "Coal, oil and natural gas release carbon dioxide when burned. These fuels are used for electricity, heating, transport and industrial processes."},
                        {"heading": "Land and forests", "body": "Forests store carbon and absorb carbon dioxide as they grow. Clearing or damaging forests can release stored carbon and reduce future absorption."},
                    ],
                    3,
                ),
                (
                    4, "Global Impacts", "Climate change and everyday life", 8, "Impacts",
                    "Explore how a changing climate can affect people, wildlife, cities, food and water.",
                    [
                        {"heading": "Impacts are not the same everywhere", "body": "Climate change can increase risks from heat, heavy rainfall, drought and rising seas. Which risks matter most depends on local conditions and how prepared communities are."},
                        {"heading": "People and nature", "body": "Changing climate conditions can put pressure on ecosystems, health, agriculture, infrastructure and livelihoods. Adapting and reducing emissions both matter."},
                    ],
                    4,
                ),
                (
                    5, "Solutions and Hope", "Ways to make a difference", 7, "Action",
                    "Discover how communities, governments, businesses and individuals can contribute to climate solutions.",
                    [
                        {"heading": "Reduce emissions", "body": "Cleaner electricity, efficient buildings, low-emission transport, reduced waste and protecting nature can all contribute to lower emissions."},
                        {"heading": "Prepare for impacts", "body": "Communities can also adapt by preparing for heat, improving flood protection, protecting green spaces and making infrastructure more resilient."},
                        {"heading": "Action at different levels", "body": "Individual choices can help, but large-scale progress also depends on public policy, infrastructure, businesses and collective action."},
                    ],
                    5,
                ),
            ]
            for lesson in lessons:
                lesson_id, title, subtitle, minutes, category, summary, sections, order = lesson
                connection.execute(
                    """INSERT INTO lessons
                    (id, title, subtitle, estimated_minutes, category, summary, sections_json, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (lesson_id, title, subtitle, minutes, category, summary, json.dumps(sections), order),
                )

            questions = [
                (1, 1, "Which statement best describes climate?", [
                    "The weather at one moment", "The usual pattern of weather over many years", "Tomorrow's forecast", "Only the temperature today"
                ], 1, "Climate describes typical weather patterns over a long period; weather describes short-term conditions.", 1),
                (2, 1, "What does climate change mean?", [
                    "Only a cold day", "A change in the daily forecast", "Long-term changes in climate patterns", "Rain during one afternoon"
                ], 2, "Climate change refers to long-term changes in temperatures and weather patterns.", 2),
                (3, 1, "What is the main driver of the rapid global warming observed today?", [
                    "Human activities that increase greenhouse gases", "The Moon's phases", "The changing seasons", "One storm by itself"
                ], 0, "Human activities, especially burning fossil fuels, increase greenhouse gases and are the main driver of current global warming.", 3),
                (4, 2, "What do greenhouse gases do in Earth's atmosphere?", [
                    "They stop all sunlight", "They absorb and re-emit some heat", "They remove all clouds", "They make weather stop"
                ], 1, "Greenhouse gases absorb and re-emit some heat leaving Earth's surface, warming the lower atmosphere.", 1),
                (5, 5, "Which is one way communities can prepare for climate impacts?", [
                    "Ignore local risks", "Remove all green spaces", "Plan for heat and flooding", "Stop collecting information"
                ], 2, "Planning for risks such as heat and flooding helps communities adapt to climate impacts.", 1),
            ]
            for question in questions:
                qid, lesson_id, prompt, options, correct, explanation, order = question
                connection.execute(
                    """INSERT INTO quiz_questions
                    (id, lesson_id, prompt, options_json, correct_index, explanation, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (qid, lesson_id, prompt, json.dumps(options), correct, explanation, order),
                )
        connection.commit()


init_db()


class QuizSubmission(BaseModel):
    question_id: int
    selected_option: int = Field(ge=0, le=9)
    learner_id: str = Field(default="demo-learner", min_length=1, max_length=80)


class LessonCompletion(BaseModel):
    learner_id: str = Field(default="demo-learner", min_length=1, max_length=80)


def lesson_from_row(row: sqlite3.Row, include_sections: bool = False) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": row["id"],
        "title": row["title"],
        "subtitle": row["subtitle"],
        "estimated_minutes": row["estimated_minutes"],
        "category": row["category"],
        "summary": row["summary"],
    }
    if include_sections:
        result["sections"] = json.loads(row["sections_json"])
    return result


@app.get("/")
def root() -> dict[str, str]:
    return {"app": "ClimateWise API", "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "climatewise-api"}


@app.get("/api/lessons")
def list_lessons() -> list[dict[str, Any]]:
    with closing(get_connection()) as connection:
        rows = connection.execute("SELECT * FROM lessons ORDER BY sort_order").fetchall()
    return [lesson_from_row(row) for row in rows]


@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: int) -> dict[str, Any]:
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson_from_row(row, include_sections=True)


@app.post("/api/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: int, payload: LessonCompletion) -> dict[str, Any]:
    with closing(get_connection()) as connection:
        exists = connection.execute("SELECT id FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
        if exists is None:
            raise HTTPException(status_code=404, detail="Lesson not found")
        connection.execute(
            """INSERT INTO lesson_completions (learner_id, lesson_id, completed_at)
               VALUES (?, ?, ?)
               ON CONFLICT(learner_id, lesson_id) DO UPDATE SET completed_at = excluded.completed_at""",
            (payload.learner_id, lesson_id, now_utc()),
        )
        connection.commit()
    return {"success": True, "lesson_id": lesson_id, "message": "Lesson marked complete"}


@app.get("/api/quiz/questions")
def list_quiz_questions(lesson_id: int | None = None) -> list[dict[str, Any]]:
    with closing(get_connection()) as connection:
        if lesson_id is None:
            rows = connection.execute("SELECT * FROM quiz_questions ORDER BY lesson_id, sort_order").fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM quiz_questions WHERE lesson_id = ? ORDER BY sort_order", (lesson_id,)
            ).fetchall()
    # Never send correct_index in this route; answers are checked by the backend.
    return [
        {"id": row["id"], "lesson_id": row["lesson_id"], "prompt": row["prompt"], "options": json.loads(row["options_json"])}
        for row in rows
    ]


@app.post("/api/quiz/submit")
def submit_quiz_answer(payload: QuizSubmission) -> dict[str, Any]:
    with closing(get_connection()) as connection:
        row = connection.execute("SELECT * FROM quiz_questions WHERE id = ?", (payload.question_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Question not found")
        options = json.loads(row["options_json"])
        if payload.selected_option >= len(options):
            raise HTTPException(status_code=422, detail="Selected option is out of range")
        is_correct = payload.selected_option == row["correct_index"]
        connection.execute(
            """INSERT INTO quiz_attempts
            (learner_id, question_id, selected_index, is_correct, created_at)
            VALUES (?, ?, ?, ?, ?)""",
            (payload.learner_id, payload.question_id, payload.selected_option, int(is_correct), now_utc()),
        )
        connection.commit()
        stats = connection.execute(
            "SELECT COUNT(*) AS attempted, COALESCE(SUM(is_correct), 0) AS correct FROM quiz_attempts WHERE learner_id = ?",
            (payload.learner_id,),
        ).fetchone()
    return {
        "question_id": payload.question_id,
        "is_correct": is_correct,
        "correct_option": row["correct_index"],
        "correct_answer": options[row["correct_index"]],
        "explanation": row["explanation"],
        "learner_stats": {
            "attempted": stats["attempted"],
            "correct": stats["correct"],
            "accuracy_percent": round((stats["correct"] / stats["attempted"]) * 100) if stats["attempted"] else 0,
        },
    }


@app.get("/api/progress/{learner_id}")
def get_progress(learner_id: str) -> dict[str, Any]:
    with closing(get_connection()) as connection:
        lesson_total = connection.execute("SELECT COUNT(*) AS n FROM lessons").fetchone()["n"]
        completed = connection.execute(
            "SELECT COUNT(*) AS n FROM lesson_completions WHERE learner_id = ?", (learner_id,)
        ).fetchone()["n"]
        quiz_stats = connection.execute(
            "SELECT COUNT(*) AS attempted, COALESCE(SUM(is_correct), 0) AS correct FROM quiz_attempts WHERE learner_id = ?",
            (learner_id,),
        ).fetchone()
    attempted = quiz_stats["attempted"]
    correct = quiz_stats["correct"]
    return {
        "learner_id": learner_id,
        "lessons_completed": completed,
        "total_lessons": lesson_total,
        "lesson_completion_percent": round(completed / lesson_total * 100) if lesson_total else 0,
        "quiz_attempts": attempted,
        "correct_answers": correct,
        "quiz_accuracy_percent": round(correct / attempted * 100) if attempted else 0,
    }
