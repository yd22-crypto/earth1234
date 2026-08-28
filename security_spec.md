# Security Specification

## 1. Data Invariants
- Each student profile belongs to a unique `studentCode`.
- A student profile document must contain valid scalar boundaries:
  - `studentCode`: Non-empty string up to 64 characters.
  - `name`: Non-empty string up to 64 characters.
  - `highScore` & `currentScore`: Non-negative numbers up to 500,000.
  - `currentStage`: Integer between 1 and 5.
  - `stagesCleared`: Array of up to 5 numbers corresponding to stages 1 to 5.
  - `title`: String up to 64 characters.
  - `totalPlays`: Non-negative number.
  - `bossDefeated`: Boolean flag.
  - `lastUpdated`: Timestamp in milliseconds.

## 2. Access Control Model
- **Read Access**: Open read to `/students/{studentCode}` and collection queries so classroom leaderboards and student lookup work seamlessly across all student devices, browsers, and URLs (dev URL, preview URL, shared links).
- **Write Access**: Create and update are allowed if the incoming payload strictly validates against `isValidStudent()` and matches the document key `{studentCode}`.
- **Delete Access**: Prohibited (`allow delete: if false;`) to protect student records from accidental deletion.
