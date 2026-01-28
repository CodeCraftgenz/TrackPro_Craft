-- ============================================
-- TrackPro - SQL para Hostinger
-- ============================================
-- Execute no phpMyAdmin da Hostinger
-- Selecione o banco u984096926_TrackProz primeiro!
-- ============================================

-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `mfa_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `mfa_secret` TEXT NULL,
    `mfa_backup_codes` TEXT NULL,
    `mfa_pending_setup` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de refresh tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `revoked_at` DATETIME NULL,
    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tenants (organizacoes)
CREATE TABLE IF NOT EXISTS `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `tenants_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de memberships (usuario <-> tenant)
CREATE TABLE IF NOT EXISTS `memberships` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'ANALYST') NOT NULL DEFAULT 'ANALYST',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `memberships_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `memberships_user_id_tenant_id_key`(`user_id`, `tenant_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS `projects` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Sao_Paulo',
    `retention_days` INT NOT NULL DEFAULT 90,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `projects_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `projects_tenant_id_domain_key`(`tenant_id`, `domain`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de API keys
CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `key_hash` VARCHAR(191) NOT NULL,
    `key_prefix` VARCHAR(12) NOT NULL,
    `key_encrypted` TEXT NULL,
    `secret_hash` VARCHAR(191) NOT NULL,
    `scopes` JSON NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_used_at` DATETIME NULL,
    `revoked_at` DATETIME NULL,
    UNIQUE INDEX `api_keys_key_hash_key`(`key_hash`),
    INDEX `api_keys_project_id_idx`(`project_id`),
    INDEX `api_keys_key_prefix_idx`(`key_prefix`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de planos
CREATE TABLE IF NOT EXISTS `plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tier` ENUM('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE') NOT NULL,
    `description` TEXT NULL,
    `monthly_price` INT NOT NULL,
    `yearly_price` INT NOT NULL,
    `stripe_price_id_monthly` VARCHAR(191) NULL,
    `stripe_price_id_yearly` VARCHAR(191) NULL,
    `max_projects` INT NOT NULL DEFAULT 1,
    `max_events_per_month` INT NOT NULL DEFAULT 10000,
    `max_team_members` INT NOT NULL DEFAULT 1,
    `retention_days` INT NOT NULL DEFAULT 30,
    `features` JSON NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `plans_tier_key`(`tier`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `status` ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED') NOT NULL DEFAULT 'TRIALING',
    `stripe_customer_id` VARCHAR(191) NULL,
    `stripe_subscription_id` VARCHAR(191) NULL,
    `billing_interval` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `current_period_start` DATETIME NULL,
    `current_period_end` DATETIME NULL,
    `trial_start` DATETIME NULL,
    `trial_end` DATETIME NULL,
    `cancel_at_period_end` TINYINT(1) NOT NULL DEFAULT 0,
    `canceled_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `subscriptions_tenant_id_key`(`tenant_id`),
    UNIQUE INDEX `subscriptions_stripe_subscription_id_key`(`stripe_subscription_id`),
    INDEX `subscriptions_plan_id_idx`(`plan_id`),
    INDEX `subscriptions_stripe_customer_id_idx`(`stripe_customer_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NOT NULL,
    `stripe_invoice_id` VARCHAR(191) NULL,
    `amount_due` INT NOT NULL,
    `amount_paid` INT NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'brl',
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',
    `invoice_url` TEXT NULL,
    `invoice_pdf` TEXT NULL,
    `period_start` DATETIME NOT NULL,
    `period_end` DATETIME NOT NULL,
    `due_date` DATETIME NULL,
    `paid_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX `invoices_stripe_invoice_id_key`(`stripe_invoice_id`),
    INDEX `invoices_subscription_id_idx`(`subscription_id`),
    INDEX `invoices_status_idx`(`status`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de registros de uso
CREATE TABLE IF NOT EXISTS `usage_records` (
    `id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NOT NULL,
    `period_start` DATETIME NOT NULL,
    `period_end` DATETIME NOT NULL,
    `events_count` INT NOT NULL DEFAULT 0,
    `projects_count` INT NOT NULL DEFAULT 0,
    `team_members_count` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `usage_records_subscription_id_idx`(`subscription_id`),
    UNIQUE INDEX `usage_records_subscription_id_period_start_key`(`subscription_id`, `period_start`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de consentimento
CREATE TABLE IF NOT EXISTS `consent_logs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `anonymous_id` VARCHAR(191) NOT NULL,
    `categories` JSON NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'sdk',
    `ip_hash` VARCHAR(191) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `consent_logs_project_id_idx`(`project_id`),
    INDEX `consent_logs_anonymous_id_idx`(`anonymous_id`),
    INDEX `consent_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `actor_user_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `resource_id` VARCHAR(191) NULL,
    `payload` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `audit_logs_tenant_id_idx`(`tenant_id`),
    INDEX `audit_logs_actor_user_id_idx`(`actor_user_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de erros
CREATE TABLE IF NOT EXISTS `error_logs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `error_logs_project_id_idx`(`project_id`),
    INDEX `error_logs_type_idx`(`type`),
    INDEX `error_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de jobs de exportacao
CREATE TABLE IF NOT EXISTS `export_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `type` ENUM('EVENTS_RAW', 'EVENTS_AGG', 'FUNNEL', 'REVENUE') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `params` JSON NOT NULL,
    `file_url` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `finished_at` DATETIME NULL,
    INDEX `export_jobs_project_id_idx`(`project_id`),
    INDEX `export_jobs_status_idx`(`status`),
    INDEX `export_jobs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de integracoes meta (Facebook Pixel)
CREATE TABLE IF NOT EXISTS `integrations_meta` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `pixel_id` VARCHAR(191) NOT NULL,
    `access_token_encrypted` TEXT NOT NULL,
    `test_event_code` VARCHAR(191) NULL,
    `enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `integrations_meta_project_id_key`(`project_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de integracoes de leads
CREATE TABLE IF NOT EXISTS `lead_integrations` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `platform` ENUM('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'WEBSITE') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'ERROR') NOT NULL DEFAULT 'PENDING',
    `access_token_encrypted` TEXT NULL,
    `refresh_token_encrypted` TEXT NULL,
    `token_expires_at` DATETIME NULL,
    `page_id` VARCHAR(191) NULL,
    `page_name` VARCHAR(191) NULL,
    `form_ids` JSON NULL,
    `webhook_secret` VARCHAR(191) NULL,
    `last_sync_at` DATETIME NULL,
    `error_message` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `lead_integrations_project_id_idx`(`project_id`),
    INDEX `lead_integrations_platform_idx`(`platform`),
    UNIQUE INDEX `lead_integrations_project_id_platform_key`(`project_id`, `platform`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configuracoes de formularios de leads
CREATE TABLE IF NOT EXISTS `lead_form_configs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fields` JSON NOT NULL,
    `styling` JSON NULL,
    `submit_url` VARCHAR(191) NULL,
    `redirect_url` VARCHAR(191) NULL,
    `enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `embed_code` TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `lead_form_configs_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configuracoes de notificacoes de leads
CREATE TABLE IF NOT EXISTS `lead_notification_configs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `webhook_url` VARCHAR(191) NULL,
    `platforms` JSON NOT NULL,
    `enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `lead_notification_configs_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE `refresh_tokens`
ADD CONSTRAINT `refresh_tokens_user_id_fkey`
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `memberships`
ADD CONSTRAINT `memberships_user_id_fkey`
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `memberships`
ADD CONSTRAINT `memberships_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `projects`
ADD CONSTRAINT `projects_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `api_keys`
ADD CONSTRAINT `api_keys_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `integrations_meta`
ADD CONSTRAINT `integrations_meta_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `consent_logs`
ADD CONSTRAINT `consent_logs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `audit_logs`
ADD CONSTRAINT `audit_logs_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `audit_logs`
ADD CONSTRAINT `audit_logs_actor_user_id_fkey`
FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `error_logs`
ADD CONSTRAINT `error_logs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lead_integrations`
ADD CONSTRAINT `lead_integrations_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lead_form_configs`
ADD CONSTRAINT `lead_form_configs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lead_notification_configs`
ADD CONSTRAINT `lead_notification_configs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `export_jobs`
ADD CONSTRAINT `export_jobs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `subscriptions`
ADD CONSTRAINT `subscriptions_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `subscriptions`
ADD CONSTRAINT `subscriptions_plan_id_fkey`
FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `invoices`
ADD CONSTRAINT `invoices_subscription_id_fkey`
FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `usage_records`
ADD CONSTRAINT `usage_records_subscription_id_fkey`
FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- SEED DATA - PLANOS PADRAO
-- ============================================

INSERT INTO `plans` (`id`, `name`, `tier`, `description`, `monthly_price`, `yearly_price`, `max_projects`, `max_events_per_month`, `max_team_members`, `retention_days`, `features`, `is_active`, `created_at`, `updated_at`) VALUES
('plan_free', 'Free', 'FREE', 'Comece com analytics basico', 0, 0, 1, 10000, 1, 30, '["basic_analytics", "single_project", "30_day_retention", "community_support"]', 1, NOW(), NOW()),
('plan_starter', 'Starter', 'STARTER', 'Para pequenas equipes', 2900, 29000, 3, 100000, 5, 90, '["basic_analytics", "advanced_funnels", "multiple_projects", "90_day_retention", "email_support", "api_access", "csv_export"]', 1, NOW(), NOW()),
('plan_professional', 'Professional', 'PROFESSIONAL', 'Para empresas em crescimento', 7900, 79000, 10, 1000000, 20, 365, '["basic_analytics", "advanced_funnels", "multiple_projects", "365_day_retention", "priority_support", "api_access", "csv_export", "integrations", "custom_reports", "mfa_support", "audit_logs", "gdpr_tools"]', 1, NOW(), NOW()),
('plan_enterprise', 'Enterprise', 'ENTERPRISE', 'Para grandes organizacoes', 19900, 199000, -1, -1, -1, 730, '["basic_analytics", "advanced_funnels", "unlimited_projects", "2_year_retention", "dedicated_support", "api_access", "csv_export", "integrations", "custom_reports", "mfa_support", "audit_logs", "gdpr_tools", "sso_saml", "custom_branding", "sla_guarantee", "dedicated_infrastructure", "onboarding"]', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT 'Tabelas criadas com sucesso!' AS status;
