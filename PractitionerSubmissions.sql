Drop table PractitionerSubmissions;
Drop table CourseCatalog;

-- Create the table for practitioner course submissions
CREATE TABLE PractitionerSubmissions (
    -- BIGSERIAL is the PostgreSQL equivalent for a BIGINT that auto-increments.
    SubmissionID BIGSERIAL PRIMARY KEY,

    PractitionerEmail VARCHAR(255) NOT NULL,
    CourseCode VARCHAR(10) NOT NULL,
    CourseName VARCHAR(255) NOT NULL,

    HoursCompleted DECIMAL(10, 2) NOT NULL,
    HoursAllocated DECIMAL(10, 2),
    DateOfCompletion DATE NOT NULL,
    IsListed BOOLEAN DEFAULT TRUE,

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

---------------------------------------------------------------------------------------------------------------------------

-- Creates the main catalog for all available courses.
CREATE TABLE CourseCatalog (
    -- Primary key, using VARCHAR as it's an alphanumeric code.
    CourseCode VARCHAR(10) PRIMARY KEY,

    MarketOffering VARCHAR(100) NOT NULL,
    LearningPillar VARCHAR(100) NOT NULL,
    CourseName VARCHAR(500) NOT NULL,
    CourseLink VARCHAR(2000) NOT NULL,

    -- TEXT is the standard PostgreSQL type for large, variable-length strings.
    CourseDescription TEXT NOT NULL,

    -- NUMERIC(5, 2) is the correct type for fixed-point decimals (e.g., 123.45).
    Duration NUMERIC(10, 2) NOT NULL,

    VendorPlatform VARCHAR(200) NOT NULL,
    CourseLevel VARCHAR(50) NOT NULL, -- "level" is a keyword, so it must be double-quoted.
    CourseorCertification VARCHAR(50) NOT NULL,
    PaidorFree VARCHAR(10) NOT NULL,

    -- This column can be empty.
    Keywords TEXT
);

-- Add comments for better documentation.
COMMENT ON TABLE CourseCatalog IS 'Stores the master list of all learning and development courses.';
COMMENT ON COLUMN CourseCatalog."courselevel" IS 'The difficulty level of the course (e.g., Beginner, Intermediate).';

-----------------------------------------------------------------------------------------------------

ALTER TABLE practitionersubmissions
ADD CONSTRAINT fk_coursecode
FOREIGN KEY (coursecode)
REFERENCES coursecatalog(coursecode);