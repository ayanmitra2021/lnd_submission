-- Create the table for practitioner course submissions
CREATE TABLE PractitionerSubmissions (
    -- BIGSERIAL is the PostgreSQL equivalent for a BIGINT that auto-increments.
    SubmissionID BIGSERIAL PRIMARY KEY,

    PractitionerEmail VARCHAR(255) NOT NULL,
    CourseCode VARCHAR(50) NOT NULL,
    CourseName VARCHAR(255) NOT NULL,

    -- DECIMAL(5, 2) allows for numbers up to 999.99
    HoursCompleted DECIMAL(5, 2) NOT NULL,
    DateOfCompletion DATE NOT NULL,

    -- Using the native UUID type is more efficient for storing and indexing GUIDs.
    CertificateGUID UUID NOT NULL,

    -- TIMESTAMPTZ (timestamp with time zone) is best practice.
    -- The record creation time is automatically set to the current time.
    CreatedTimestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastModifiedTimestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add a comment to the table for clarity
COMMENT ON TABLE PractitionerSubmissions IS 'Stores course completion records submitted by practitioners.';

-- It is highly recommended to add a unique constraint to prevent duplicate submissions
-- for the same course by the same practitioner. The "performance year" logic
-- should be handled in your application code before performing an INSERT or UPDATE.
CREATE UNIQUE INDEX idx_unique_submission ON PractitionerSubmissions (PractitionerEmail, CourseCode);