# API Reference

**Base URL:** `/api`
**Authentication:** HTTP-Only Cookies (include `credentials: 'include'` in requests) or `Authorization: Bearer <token>`

---

## Health

### `GET /api/health`
**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-06-29T11:30:00.000Z"
}
```

---

## Authentication

### `POST /api/auth/register`
**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "securePassword123!"
}
```
**Response:** `201 Created`
```json
{
  "message": "Account created successfully. You can now log in.",
  "user": {
    "id": "cuid",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "LEARNER",
    "createdAt": "2026-06-29T11:30:00.000Z"
  }
}
```

### `POST /api/auth/login`
**Request Body:**
```json
{
  "email": "jane.doe@example.com",
  "password": "securePassword123!"
}
```
**Response:** `200 OK`
*(Returns JWT in HTTP-Only `token` cookie)*
```json
{
  "user": {
    "id": "cuid",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "LEARNER",
    "academicLevel": "SECONDARY",
    "department": "SCIENCE",
    "moodTheme": "LIGHT",
    "points": 150,
    "image": "url",
    "isOnboardingComplete": true
  }
}
```

### `POST /api/auth/logout`
**Response:** `200 OK`
*(Clears `token` cookie)*
```json
{
  "message": "Logged out successfully"
}
```

---

## Courses

### `GET /api/courses/:courseId/lessons/:lessonId`
*Requires Authentication*

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": "lesson-id",
      "title": "Introduction to Algebra",
      "content": "...",
      "moduleId": "module-id",
      "order": 1
    },
    "nextLessonId": "next-lesson-id",
    "prevLessonId": null,
    "module": {
      "id": "module-id",
      "title": "Module 1: Basics",
      "courseId": "course-id",
      "order": 1
    },
    "allLessonsCount": 10,
    "currentIndex": 0,
    "isCompleted": false
  }
}
```
