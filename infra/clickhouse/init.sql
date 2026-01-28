-- ============================================
-- TrackPro ClickHouse Schema
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS trackpro;

USE trackpro;

-- ============================================
-- EVENTS RAW TABLE
-- Main table for storing raw events
-- ============================================
CREATE TABLE IF NOT EXISTS events_raw
(
    event_id String,
    project_id String,
    event_name LowCardinality(String),
    event_time UInt32,
    received_at UInt32,
    anonymous_id String,
    user_id String DEFAULT '',
    session_id String,
    url String DEFAULT '',
    path String DEFAULT '',
    referrer String DEFAULT '',
    utm_source LowCardinality(String) DEFAULT '',
    utm_medium LowCardinality(String) DEFAULT '',
    utm_campaign String DEFAULT '',
    utm_content String DEFAULT '',
    utm_term String DEFAULT '',
    ip String DEFAULT '',
    user_agent String DEFAULT '',
    country LowCardinality(String) DEFAULT '',
    consent_categories Array(LowCardinality(String)),
    order_id String DEFAULT '',
    value Float64 DEFAULT 0,
    currency LowCardinality(String) DEFAULT '',
    payload_json String DEFAULT '{}'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(toDateTime(event_time))
ORDER BY (project_id, event_time, event_id)
TTL toDateTime(event_time) + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- Index for fast lookups
ALTER TABLE events_raw ADD INDEX idx_event_name event_name TYPE bloom_filter GRANULARITY 1;
ALTER TABLE events_raw ADD INDEX idx_anonymous_id anonymous_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE events_raw ADD INDEX idx_session_id session_id TYPE bloom_filter GRANULARITY 1;

-- ============================================
-- EVENTS INVALID TABLE
-- Quarantine table for invalid events
-- ============================================
CREATE TABLE IF NOT EXISTS events_invalid
(
    request_id String,
    reason String,
    raw_payload String,
    received_at UInt32
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(toDateTime(received_at))
ORDER BY (received_at, request_id)
TTL toDateTime(received_at) + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

-- ============================================
-- META DELIVERY LOG
-- Tracks Meta CAPI delivery status
-- ============================================
CREATE TABLE IF NOT EXISTS meta_delivery_log
(
    event_id String,
    project_id String,
    status LowCardinality(String),
    attempts UInt8,
    last_error String DEFAULT '',
    updated_at UInt32
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (project_id, event_id)
TTL toDateTime(updated_at) + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- ============================================
-- AGGREGATED TABLES
-- ============================================

-- Daily event aggregates
CREATE TABLE IF NOT EXISTS events_agg_daily
(
    project_id String,
    date Date,
    event_name LowCardinality(String),
    event_count UInt64,
    unique_users UInt64,
    unique_sessions UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, event_name)
TTL date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- Funnel daily aggregates
CREATE TABLE IF NOT EXISTS funnel_agg_daily
(
    project_id String,
    date Date,
    step_name LowCardinality(String),
    step_order UInt8,
    users_count UInt64,
    sessions_count UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, step_order)
TTL date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- Revenue daily aggregates
CREATE TABLE IF NOT EXISTS revenue_agg_daily
(
    project_id String,
    date Date,
    utm_source LowCardinality(String),
    utm_medium LowCardinality(String),
    utm_campaign String,
    orders_count UInt64,
    total_revenue Float64,
    currency LowCardinality(String)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, utm_source, utm_medium, utm_campaign)
TTL date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- ============================================
-- MATERIALIZED VIEWS
-- Auto-populate aggregated tables
-- ============================================

-- MV: Daily event aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS events_agg_daily_mv
TO events_agg_daily
AS SELECT
    project_id,
    toDate(toDateTime(event_time)) AS date,
    event_name,
    count() AS event_count,
    uniqExact(anonymous_id) AS unique_users,
    uniqExact(session_id) AS unique_sessions
FROM events_raw
GROUP BY project_id, date, event_name;

-- MV: Revenue aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS revenue_agg_daily_mv
TO revenue_agg_daily
AS SELECT
    project_id,
    toDate(toDateTime(event_time)) AS date,
    utm_source,
    utm_medium,
    utm_campaign,
    count() AS orders_count,
    sum(value) AS total_revenue,
    any(currency) AS currency
FROM events_raw
WHERE event_name = 'purchase' AND value > 0
GROUP BY project_id, date, utm_source, utm_medium, utm_campaign;

-- ============================================
-- USEFUL VIEWS FOR QUERYING
-- ============================================

-- View: Events with parsed JSON payload
CREATE VIEW IF NOT EXISTS events_with_payload AS
SELECT
    *,
    JSONExtractString(payload_json, 'fbp') AS fbp,
    JSONExtractString(payload_json, 'fbc') AS fbc
FROM events_raw;

-- View: User sessions
CREATE VIEW IF NOT EXISTS user_sessions AS
SELECT
    project_id,
    anonymous_id,
    session_id,
    min(event_time) AS session_start,
    max(event_time) AS session_end,
    count() AS events_count,
    groupArray(event_name) AS events_sequence
FROM events_raw
GROUP BY project_id, anonymous_id, session_id;
