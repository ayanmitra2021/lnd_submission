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
    Keywords TEXT,

    IsActive BOOLEAN DEFAULT TRUE,
     -- The record creation time is automatically set to the current time.
    CreatedTimestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastModifiedTimestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   
);

-- Add comments for better documentation.
COMMENT ON TABLE CourseCatalog IS 'Stores the master list of all learning and development courses.';
COMMENT ON COLUMN CourseCatalog."courselevel" IS 'The difficulty level of the course (e.g., Beginner, Intermediate).';

-----------------------------------------------------------------------------------------------------

ALTER TABLE practitionersubmissions
ADD CONSTRAINT fk_coursecode
FOREIGN KEY (coursecode)
REFERENCES coursecatalog(coursecode);

----------------------------------------------------------------------------------------------------

-- Market Offering Master
CREATE TABLE MarketOfferings (
    -- BIGSERIAL is the PostgreSQL equivalent for a BIGINT that auto-increments.
    MarketOfferingId BIGSERIAL PRIMARY KEY,
	MarketOfferingName VARCHAR(2000) NOT NULL, 
	MarketOfferingDescription TEXT
)

INSERT INTO MarketOfferings (MarketOfferingName, MarketOfferingDescription) VALUES ('Advanced Soft Skills','Advanced Soft Skills');
INSERT INTO MarketOfferings (MarketOfferingName, MarketOfferingDescription) VALUES ('Alliances and Tech Relationships','Alliances and Tech Relationships');
INSERT INTO MarketOfferings (MarketOfferingName, MarketOfferingDescription) VALUES ('Core','Core');
INSERT INTO MarketOfferings (MarketOfferingName, MarketOfferingDescription) VALUES ('Connected Edge','Connected Edge');
INSERT INTO MarketOfferings (MarketOfferingName, MarketOfferingDescription) VALUES ('Hybrid Cloud Transformation','Hybrid Cloud Transformation');
INSERT INTO MarketOfferings (MarketOfferingName, MarketOfferingDescription) VALUES ('Hybrid Managed Services','Hybrid Managed Services');

-- Learning Pillar Master
CREATE TABLE LearningPillars (
    -- BIGSERIAL is the PostgreSQL equivalent for a BIGINT that auto-increments.
    LearningPillarId BIGSERIAL PRIMARY KEY,
	MarketOfferingId BIGINT,
	LearningPillarName VARCHAR(2000) NOT NULL,
	LearningPillarDescription TEXT
)

ALTER TABLE learningpillars
ADD CONSTRAINT fk_marketoffering
FOREIGN KEY (marketofferingid)
REFERENCES marketofferings(marketofferingid);


INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (1, 'Client Relationships', 'Client Relationships');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (1, 'Coaching', 'Coaching');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (1, 'Teaming', 'Teaming');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (1, 'Storyboarding', 'Storyboarding');

INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (2, 'AWS', 'AWS');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (2, 'Google', 'Google');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (2, 'Microsoft', 'Microsoft');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (2, 'Oracle', 'Oracle');

INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (3, 'Fundamentals', 'Fundamentals');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (3, 'GenAI', 'GenAI');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (3, 'LinkedIn', 'LinkedIn');

INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (4, 'Distributed AI Infrastructure', 'Distributed AI Infrastructure');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (4, 'Enterprise Networks', 'Enterprise Networks');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (4, 'Industrial Internet of Things (IIoT) Connectivity', 'Industrial Internet of Things (IIoT) Connectivity');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (4, 'Hybrid Edge AI Solutions', 'Hybrid Edge AI Solutions');

INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (5, 'AI Data Center & Infrastructure', 'AI Data Center & Infrastructure');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (5, 'Oracle Cloud Infrastructure', 'Oracle Cloud Infrastructure');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (5, 'Modern Workplace', 'Modern Workplace');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (5, 'Hybrid Cloud Migration', 'Hybrid Cloud Migration');

INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (6, 'AI/HPC Operations', 'AI/HPC Operations');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (6, 'Cloud Managed Services', 'Cloud Managed Services');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (6, 'Infrastructure Managed Services', 'Infrastructure Managed Services');
INSERT INTO LearningPillars (MarketOfferingId, LearningPillarName, LearningPillarDescription) VALUES (6, 'Service Desk/EUC', 'Service Desk/EUC');

-- General Master Values
CREATE TABLE MasterValues (
    -- BIGSERIAL is the PostgreSQL equivalent for a BIGINT that auto-increments.
    MasterValueId BIGSERIAL PRIMARY KEY,
    MasterValueColumn VARCHAR(255) NOT NULL,
    AllowedValue VARCHAR(2000) NOT NULL
)

INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseLevel','Beginner');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseLevel','Advanced');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseLevel','Intermediate');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseLevel','Expert');

INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('PaidOrFree','Free');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('PaidOrFree','Paid');

INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseOrCertification','Course');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseOrCertification','Certification');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseOrCertification','Document');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseOrCertification','Course & Certification');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseOrCertification','Course/Workshop');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseOrCertification','Practice Test');
INSERT INTO MasterValues (MasterValueColumn, AllowedValue) VALUES ('CourseOrCertification','Document/Certification');
