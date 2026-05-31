-- ============================================================
--  LinkedIn Contact Manager — Local MySQL Setup
--  Run: mysql -u root -p"Devsharma_765@<>" < setup.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS bmi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bmi;

-- ── GARIMA TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS garima (
  id                      INT           NOT NULL AUTO_INCREMENT,
  name                    VARCHAR(255)           DEFAULT '',
  email                   VARCHAR(255)           DEFAULT '',
  phone                   VARCHAR(50)            DEFAULT '',
  linkedin                VARCHAR(500)           DEFAULT '',
  website                 VARCHAR(500)           DEFAULT '',
  current_company_1       VARCHAR(255)           DEFAULT '',
  current_designation_1   VARCHAR(255)           DEFAULT '',
  current_duration_1      VARCHAR(255)           DEFAULT '',
  current_location_1      VARCHAR(255)           DEFAULT '',
  current_company_2       VARCHAR(255)           DEFAULT '',
  current_designation_2   VARCHAR(255)           DEFAULT '',
  current_duration_2      VARCHAR(255)           DEFAULT '',
  current_location_2      VARCHAR(255)           DEFAULT '',
  previous_company_1      VARCHAR(255)           DEFAULT '',
  previous_designation_1  VARCHAR(255)           DEFAULT '',
  previous_duration_1     VARCHAR(255)           DEFAULT '',
  previous_location_1     VARCHAR(255)           DEFAULT '',
  previous_company_2      VARCHAR(255)           DEFAULT '',
  previous_designation_2  VARCHAR(255)           DEFAULT '',
  previous_duration_2     VARCHAR(255)           DEFAULT '',
  previous_location_2     VARCHAR(255)           DEFAULT '',
  previous_company_3      VARCHAR(255)           DEFAULT '',
  previous_designation_3  VARCHAR(255)           DEFAULT '',
  previous_duration_3     VARCHAR(255)           DEFAULT '',
  previous_location_3     VARCHAR(255)           DEFAULT '',
  previous_company_4      VARCHAR(255)           DEFAULT '',
  previous_designation_4  VARCHAR(255)           DEFAULT '',
  previous_duration_4     VARCHAR(255)           DEFAULT '',
  previous_location_4     VARCHAR(255)           DEFAULT '',
  previous_company_5      VARCHAR(255)           DEFAULT '',
  previous_designation_5  VARCHAR(255)           DEFAULT '',
  previous_duration_5     VARCHAR(255)           DEFAULT '',
  previous_location_5     VARCHAR(255)           DEFAULT '',
  created_at              DATETIME               DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_name  (name(100)),
  KEY idx_email (email(100)),
  KEY idx_loc   (current_location_1(100)),
  KEY idx_co1   (current_company_1(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LMS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms (
  id                      INT           NOT NULL AUTO_INCREMENT,
  name                    VARCHAR(255)           DEFAULT '',
  email                   VARCHAR(255)           DEFAULT '',
  phone                   VARCHAR(50)            DEFAULT '',
  linkedin                VARCHAR(500)           DEFAULT '',
  website                 VARCHAR(500)           DEFAULT '',
  current_company_1       VARCHAR(255)           DEFAULT '',
  current_designation_1   VARCHAR(255)           DEFAULT '',
  current_duration_1      VARCHAR(255)           DEFAULT '',
  current_location_1      VARCHAR(255)           DEFAULT '',
  current_company_2       VARCHAR(255)           DEFAULT '',
  current_designation_2   VARCHAR(255)           DEFAULT '',
  current_duration_2      VARCHAR(255)           DEFAULT '',
  current_location_2      VARCHAR(255)           DEFAULT '',
  previous_company_1      VARCHAR(255)           DEFAULT '',
  previous_designation_1  VARCHAR(255)           DEFAULT '',
  previous_duration_1     VARCHAR(255)           DEFAULT '',
  previous_location_1     VARCHAR(255)           DEFAULT '',
  previous_company_2      VARCHAR(255)           DEFAULT '',
  previous_designation_2  VARCHAR(255)           DEFAULT '',
  previous_duration_2     VARCHAR(255)           DEFAULT '',
  previous_location_2     VARCHAR(255)           DEFAULT '',
  previous_company_3      VARCHAR(255)           DEFAULT '',
  previous_designation_3  VARCHAR(255)           DEFAULT '',
  previous_duration_3     VARCHAR(255)           DEFAULT '',
  previous_location_3     VARCHAR(255)           DEFAULT '',
  previous_company_4      VARCHAR(255)           DEFAULT '',
  previous_designation_4  VARCHAR(255)           DEFAULT '',
  previous_duration_4     VARCHAR(255)           DEFAULT '',
  previous_location_4     VARCHAR(255)           DEFAULT '',
  previous_company_5      VARCHAR(255)           DEFAULT '',
  previous_designation_5  VARCHAR(255)           DEFAULT '',
  previous_duration_5     VARCHAR(255)           DEFAULT '',
  previous_location_5     VARCHAR(255)           DEFAULT '',
  created_at              DATETIME               DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_name  (name(100)),
  KEY idx_email (email(100)),
  KEY idx_loc   (current_location_1(100)),
  KEY idx_co1   (current_company_1(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tables created successfully' AS status;
SHOW TABLES;
