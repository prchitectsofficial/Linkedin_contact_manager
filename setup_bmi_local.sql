-- ============================================================
--  Local MySQL Setup for LinkedIn Contact Manager - Brand Index
--  Run this once in MySQL Workbench or terminal:
--  mysql -u root -p < setup_bmi_local.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS bmi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bmi;

CREATE TABLE IF NOT EXISTS brands (
  id              INT             NOT NULL AUTO_INCREMENT,
  brand           VARCHAR(255)    NOT NULL DEFAULT '',
  client          VARCHAR(255)             DEFAULT '',   -- point of contact name
  designation     VARCHAR(255)             DEFAULT '',
  email           VARCHAR(255)             DEFAULT '',
  contact         VARCHAR(100)             DEFAULT '',   -- phone number
  company         VARCHAR(255)             DEFAULT '',
  website         VARCHAR(500)             DEFAULT '',
  linkedin        VARCHAR(500)             DEFAULT '',   -- LinkedIn profile URL
  linkedin_email  VARCHAR(255)             DEFAULT '',   -- email found via LinkedIn
  linkedin_members TEXT                    DEFAULT NULL, -- stored list of LinkedIn members

  -- outreach status flags
  conn_sent       TINYINT(1)      NOT NULL DEFAULT 0,
  conn_est        TINYINT(1)      NOT NULL DEFAULT 0,
  est_date        DATETIME                 DEFAULT NULL, -- date connection was established
  est_source      VARCHAR(100)             DEFAULT '',   -- e.g. "LinkedIn", "Manual Entry"
  pitch_sent      TINYINT(1)      NOT NULL DEFAULT 0,   -- LinkedIn message sent
  linkedin_follow TINYINT(1)      NOT NULL DEFAULT 0,   -- LinkedIn followup done
  email_outreach  TINYINT(1)      NOT NULL DEFAULT 0,   -- personal email outreach done
  pitch_response  TEXT                     DEFAULT NULL, -- notes / pitch response text
  email_send_from VARCHAR(255)             DEFAULT '',   -- which prchitects email was used

  -- classification
  opinion         VARCHAR(100)             DEFAULT '',
  -- possible values: relevant | irrelevant | BMI starter | BMI enterprise |
  --                  unreachable | unresponsive | negotiation failed | already in touch

  brand_source    VARCHAR(100)             DEFAULT 'LinkedIn',
  -- possible values: LinkedIn | Marketplace | Vbout LinkedIn

  -- team
  handler         VARCHAR(100)             DEFAULT '',
  createdby       VARCHAR(255)             DEFAULT '',

  -- misc flags
  follow          TINYINT(1)      NOT NULL DEFAULT 0,   -- star / follow flag
  recommend       TINYINT(1)      NOT NULL DEFAULT 0,   -- recommended for YouTube search
  brand_in_be     INT             NOT NULL DEFAULT 0,   -- brand present in Brand Extractor

  -- timestamps
  createdon       DATETIME                 DEFAULT CURRENT_TIMESTAMP,
  lastupdate      DATETIME                 DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_brand (brand),
  KEY idx_handler    (handler),
  KEY idx_opinion    (opinion),
  KEY idx_source     (brand_source),
  KEY idx_createdon  (createdon)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Verify ────────────────────────────────────────────────────
SELECT 'bmi.brands table created successfully' AS status;
DESCRIBE bmi.brands;
