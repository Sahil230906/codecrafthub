const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");

// Create the Express application
const app = express();

// The server must run on port 5000
const PORT = 5000;

// Store courses.json in the same directory as this file
const COURSES_FILE = path.join(__dirname, "courses.json");

// Allowed values for a course status
const ALLOWED_STATUSES = ["Not Started", "In Progress", "Completed"];

// Middleware that allows Express to read JSON request bodies
app.use(express.json());

/*
  Creates courses.json automatically if it does not already exist.

  The file starts with an empty array because courses will be stored
  as an array of objects.
*/
async function ensureCoursesFile() {
  try {
    await fs.access(COURSES_FILE);
  } catch (error) {
    // ENOENT means the file does not exist
    if (error.code === "ENOENT") {
      await fs.writeFile(COURSES_FILE, "[]", "utf8");
    } else {
      throw error;
    }
  }
}

/*
  Reads and parses all courses from courses.json.

  JSON.parse converts the text in the file into a JavaScript array.
*/
async function readCourses() {
  try {
    await ensureCoursesFile();

    const fileContents = await fs.readFile(COURSES_FILE, "utf8");

    return JSON.parse(fileContents);
  } catch (error) {
    // Add a helpful message for the error-handling middleware
    error.operation = "read";
    throw error;
  }
}

/*
  Saves the courses array to courses.json.

  JSON.stringify converts the JavaScript array into formatted JSON text.
*/
async function writeCourses(courses) {
  try {
    await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2), "utf8");
  } catch (error) {
    // Add a helpful message for the error-handling middleware
    error.operation = "write";
    throw error;
  }
}

/*
  Checks whether a date is a valid date in YYYY-MM-DD format.

  Examples:
  - 2026-12-31: valid
  - 2026-2-1: invalid
  - 2026-02-30: invalid
*/
function isValidDate(dateValue) {
  if (typeof dateValue !== "string") {
    return false;
  }

  // First check the exact YYYY-MM-DD shape
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return false;
  }

  const date = new Date(`${dateValue}T00:00:00.000Z`);

  // Check that JavaScript recognized the date
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  // This catches invalid dates such as 2026-02-30
  return date.toISOString().slice(0, 10) === dateValue;
}

/*
  Validates the required fields for a course.

  This application uses PUT, so all course fields are required when
  updating an existing course.
*/
function validateCourse(courseData) {
  const errors = [];

  if (typeof courseData.name !== "string" || courseData.name.trim() === "") {
    errors.push("name is required");
  }

  if (
    typeof courseData.description !== "string" ||
    courseData.description.trim() === ""
  ) {
    errors.push("description is required");
  }

  if (!courseData.target_date) {
    errors.push("target_date is required");
  } else if (!isValidDate(courseData.target_date)) {
    errors.push("target_date must use the YYYY-MM-DD format");
  }

  if (!courseData.status) {
    errors.push("status is required");
  } else if (!ALLOWED_STATUSES.includes(courseData.status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }

  return errors;
}

/*
  Generates the next numeric course ID.

  - The first course receives ID 1.
  - The next course receives the highest existing ID plus 1.
*/
function generateNextId(courses) {
  if (courses.length === 0) {
    return 1;
  }

  const highestId = Math.max(...courses.map((course) => Number(course.id)));

  return highestId + 1;
}

/*
  POST /api/courses

  Adds a new course.
*/
app.post("/api/courses", async (req, res, next) => {
  try {
    // Validate the request body
    const validationErrors = validateCourse(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    const courses = await readCourses();
    const now = new Date().toISOString();

    const newCourse = {
      id: generateNextId(courses),
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: now,
    };

    courses.push(newCourse);
    await writeCourses(courses);

    res.status(201).json(newCourse);
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/courses

  Returns all courses.
*/
app.get("/api/courses", async (req, res, next) => {
  try {
    const courses = await readCourses();

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/courses/:id

  Returns one course based on its numeric ID.
*/
app.get("/api/courses/:id", async (req, res, next) => {
  try {
    const courses = await readCourses();

    const course = courses.find((item) => item.id === Number(req.params.id));

    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
});

/*
  PUT /api/courses/:id

  Replaces the editable fields of an existing course.

  The ID and created_at timestamp are preserved and cannot be changed.
*/
app.put("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = Number(req.params.id);

    const courses = await readCourses();

    const courseIndex = courses.findIndex((course) => course.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    // PUT requires all editable course fields
    const validationErrors = validateCourse(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    const existingCourse = courses[courseIndex];

    const updatedCourse = {
      id: existingCourse.id,
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      target_date: req.body.target_date,
      status: req.body.status,
      created_at: existingCourse.created_at,
    };

    courses[courseIndex] = updatedCourse;

    await writeCourses(courses);

    res.status(200).json(updatedCourse);
  } catch (error) {
    next(error);
  }
});

/*
  DELETE /api/courses/:id

  Deletes a course based on its numeric ID.
*/
app.delete("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = Number(req.params.id);

    const courses = await readCourses();

    const courseIndex = courses.findIndex((course) => course.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    // Remove one course from the array
    courses.splice(courseIndex, 1);

    await writeCourses(courses);

    // 204 means the deletion succeeded and there is no response body
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/*
  Handles invalid JSON sent in a request body.

  For example, this catches malformed JSON such as:
  { "name": "JavaScript"
*/
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      error: "Request body contains invalid JSON",
    });
  }

  next(error);
});

/*
  Handles file read/write errors and unexpected errors.

  This middleware must be defined after all routes.
*/
app.use((error, req, res, next) => {
  console.error(error);

  if (error.operation === "read") {
    return res.status(500).json({
      error: "Unable to read courses.json",
    });
  }

  if (error.operation === "write") {
    return res.status(500).json({
      error: "Unable to write to courses.json",
    });
  }

  if (error instanceof SyntaxError) {
    return res.status(500).json({
      error: "courses.json contains invalid JSON",
    });
  }

  res.status(500).json({
    error: "Internal server error",
  });
});

/*
  Start the server only after ensuring courses.json exists.
*/
async function startServer() {
  try {
    await ensureCoursesFile();

    app.listen(PORT, () => {
      console.log(`CodeCraftHub API running on port ${PORT}`);
      console.log(`Courses file: ${COURSES_FILE}`);
    });
  } catch (error) {
    console.error("Unable to start the server:", error.message);
    process.exit(1);
  }
}

startServer();
