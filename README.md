# CodeCraftHub

Personal learning goal tracker API built with Node.js, Express, and a JSON file for data storage.

## Project Overview

CodeCraftHub allows developers to track courses they want to learn. Each course includes a name, description, target completion date, status, creation timestamp, and automatically generated numeric ID.

The application uses `courses.json` instead of a database, making it simple to install and suitable for learning REST API fundamentals.

## Features

- Create learning courses
- View all courses
- View a specific course
- Update an existing course
- Delete a course
- Automatically creates `courses.json` if it does not exist
- Automatically generates course IDs starting from `1`
- Validates required fields
- Validates dates using the `YYYY-MM-DD` format
- Validates course status values
- Handles file read and write errors
- Runs on port `5000`

## Course Fields

Each course has the following properties:

| Field         | Description                           |
| ------------- | ------------------------------------- |
| `id`          | Automatically generated numeric ID    |
| `name`        | Required course name                  |
| `description` | Required course description           |
| `target_date` | Required date in `YYYY-MM-DD` format  |
| `status`      | Required status value                 |
| `created_at`  | Automatically generated ISO timestamp |

Valid status values:

```text
Not Started
In Progress
Completed
```

## Project Structure

```text
codecrafthub/
├── app.js
├── courses.json
├── package.json
└── README.md
```

The `courses.json` file is created automatically when the application starts if it does not already exist.

## Installation

### Prerequisites

Make sure you have installed:

- Node.js
- npm

Check your versions:

```bash
node --version
npm --version
```

### Install the Project

Navigate to the project directory:

```bash
cd codecrafthub
```

Install the dependencies:

```bash
npm install
```

## Running the Application

Start the server using the npm start script:

```bash
npm start
```

The API will run at:

```text
http://localhost:5000
```

You should see output similar to:

```text
CodeCraftHub API running on port 5000
```

## API Documentation

Base URL:

```text
http://localhost:5000/api/courses
```

**Windows PowerShell users:** use `curl.exe` instead of `curl`, and send JSON from a file, for example: `curl.exe -X POST http://localhost:5000/api/courses -H "Content-Type: application/json" -d "@course1.json"`

All request bodies must use JSON and include this header:

```http
Content-Type: application/json
```

### Create a Course

Creates a new course.

```http
POST /api/courses
```

Example request:

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "REST API Fundamentals",
    "description": "Learn how to build REST APIs with Node.js and Express.",
    "target_date": "2026-12-31",
    "status": "Not Started"
  }'
```

Example response:

```json
{
  "id": 1,
  "name": "REST API Fundamentals",
  "description": "Learn how to build REST APIs with Node.js and Express.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-10-26T12:00:00.000Z"
}
```

Response status:

```text
201 Created
```

### Get All Courses

Returns all saved courses.

```http
GET /api/courses
```

Example request:

```bash
curl http://localhost:5000/api/courses
```

Example response:

```json
[
  {
    "id": 1,
    "name": "REST API Fundamentals",
    "description": "Learn how to build REST APIs with Node.js and Express.",
    "target_date": "2026-12-31",
    "status": "Not Started",
    "created_at": "2026-10-26T12:00:00.000Z"
  }
]
```

Response status:

```text
200 OK
```

### Get a Specific Course

Returns one course by its ID.

```http
GET /api/courses/:id
```

Example request:

```bash
curl http://localhost:5000/api/courses/1
```

Example response:

```json
{
  "id": 1,
  "name": "REST API Fundamentals",
  "description": "Learn how to build REST APIs with Node.js and Express.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-10-26T12:00:00.000Z"
}
```

Response status:

```text
200 OK
```

If the course does not exist:

```json
{
  "error": "Course not found"
}
```

Response status:

```text
404 Not Found
```

### Update a Course

Replaces an existing course. All editable fields are required when using `PUT`.

```http
PUT /api/courses/:id
```

Example request:

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced REST API Development",
    "description": "Build production-ready REST APIs with Express.",
    "target_date": "2027-01-31",
    "status": "In Progress"
  }'
```

Example response:

```json
{
  "id": 1,
  "name": "Advanced REST API Development",
  "description": "Build production-ready REST APIs with Express.",
  "target_date": "2027-01-31",
  "status": "In Progress",
  "created_at": "2026-10-26T12:00:00.000Z"
}
```

The `id` and `created_at` values are preserved during an update.

Response status:

```text
200 OK
```

### Delete a Course

Deletes a course by its ID.

```http
DELETE /api/courses/:id
```

Example request:

```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

Response status:

```text
204 No Content
```

If the course does not exist:

```json
{
  "error": "Course not found"
}
```

Response status:

```text
404 Not Found
```

## Validation Errors

### Missing Required Fields

Example request:

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "REST APIs"
  }'
```

Example response:

```json
{
  "error": "Validation failed",
  "details": [
    "description is required",
    "target_date is required",
    "status is required"
  ]
}
```

Response status:

```text
400 Bad Request
```

### Invalid Status

Valid values are:

```text
Not Started
In Progress
Completed
```

Example invalid request:

```json
{
  "name": "REST APIs",
  "description": "Learn REST API development.",
  "target_date": "2026-12-31",
  "status": "Pending"
}
```

Example response:

```json
{
  "error": "Validation failed",
  "details": ["status must be one of: Not Started, In Progress, Completed"]
}
```

### Invalid Date

The date must use the `YYYY-MM-DD` format.

Valid:

```text
2026-12-31
```

Invalid:

```text
31-12-2026
2026/12/31
2026-2-1
```

## Troubleshooting

### `npm: command not found`

Install Node.js from the official Node.js website, then restart your terminal.

Verify the installation:

```bash
node --version
npm --version
```

### `Cannot find module 'express'`

Install the project dependencies:

```bash
npm install
```

### Port 5000 Is Already in Use

Another application may already be using port `5000`.

On macOS or Linux, find the process using the port:

```bash
lsof -i :5000
```

On Windows:

```bash
netstat -ano | findstr :5000
```

Stop the conflicting application, then run:

```bash
npm start
```

### `courses.json` Is Missing

The application automatically creates `courses.json` when it starts. Make sure the application has permission to write to its project directory.

You can also create the file manually with this content:

```json
[]
```

### Unable to Read or Write `courses.json`

Check that:

- `courses.json` contains valid JSON
- The project directory is writable
- The file is not locked by another application
- The application is running from the correct project directory

### Invalid JSON Request Error

Make sure the request body is valid JSON and includes the correct header:

```http
Content-Type: application/json
```

Correct:

```json
{
  "name": "REST APIs"
}
```

Incorrect:

```json
{
  "name": "REST APIs"
```

## Data Storage Note

This project uses a JSON file for simplicity. It is suitable for learning and small local projects, but it is not designed for high-traffic production applications. A database would be more appropriate for concurrent users and larger amounts of data.
