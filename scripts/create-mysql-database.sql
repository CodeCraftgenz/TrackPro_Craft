-- ============================================
-- TrackPro - MySQL Database Creation Script
-- ============================================
-- Execute este script para criar todas as tabelas
--
-- Uso:
--   mysql -u root -p < create-mysql-database.sql
--
-- Ou no MySQL Workbench:
--   1. Conecte ao servidor
--   2. Abra este arquivo
--   3. Execute (Ctrl+Shift+Enter)
-- ============================================

-- Criar o banco de dados (se não existir)
CREATE DATABASE IF NOT EXISTS trackpro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE trackpro;

-- ============================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- ============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `mfa_enabled` BOOLEAN NOT NULL DEFAULT false,
    `mfa_secret` TEXT NULL,
    `mfa_backup_codes` TEXT NULL,
    `mfa_pending_setup` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de refresh tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE TENANT (MULTI-TENANCY)
-- ============================================

-- Tabela de tenants (organizações)
CREATE TABLE IF NOT EXISTS `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenants_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de memberships (usuário <-> tenant)
CREATE TABLE IF NOT EXISTS `memberships` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'ANALYST') NOT NULL DEFAULT 'ANALYST',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `memberships_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `memberships_user_id_tenant_id_key`(`user_id`, `tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE PROJETOS
-- ============================================

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS `projects` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Sao_Paulo',
    `retention_days` INTEGER NOT NULL DEFAULT 90,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `projects_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `projects_tenant_id_domain_key`(`tenant_id`, `domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,

    UNIQUE INDEX `api_keys_key_hash_key`(`key_hash`),
    INDEX `api_keys_project_id_idx`(`project_id`),
    INDEX `api_keys_key_prefix_idx`(`key_prefix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE INTEGRAÇÕES
-- ============================================

-- Tabela de meta de integrações (Facebook Pixel, etc)
CREATE TABLE IF NOT EXISTS `integrations_meta` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `pixel_id` VARCHAR(191) NOT NULL,
    `access_token_encrypted` TEXT NOT NULL,
    `test_event_code` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `integrations_meta_project_id_key`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de integrações de leads
CREATE TABLE IF NOT EXISTS `lead_integrations` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `platform` ENUM('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'WEBSITE') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'ERROR') NOT NULL DEFAULT 'PENDING',
    `access_token_encrypted` TEXT NULL,
    `refresh_token_encrypted` TEXT NULL,
    `token_expires_at` DATETIME(3) NULL,
    `page_id` VARCHAR(191) NULL,
    `page_name` VARCHAR(191) NULL,
    `form_ids` JSON NULL,
    `webhook_secret` VARCHAR(191) NULL,
    `last_sync_at` DATETIME(3) NULL,
    `error_message` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lead_integrations_project_id_idx`(`project_id`),
    INDEX `lead_integrations_platform_idx`(`platform`),
    UNIQUE INDEX `lead_integrations_project_id_platform_key`(`project_id`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de configurações de formulários de leads
CREATE TABLE IF NOT EXISTS `lead_form_configs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fields` JSON NOT NULL,
    `styling` JSON NULL,
    `submit_url` VARCHAR(191) NULL,
    `redirect_url` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `embed_code` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lead_form_configs_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de configurações de notificações de leads
CREATE TABLE IF NOT EXISTS `lead_notification_configs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `webhook_url` VARCHAR(191) NULL,
    `platforms` JSON NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lead_notification_configs_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE CONSENTIMENTO E PRIVACIDADE
-- ============================================

-- Tabela de logs de consentimento
CREATE TABLE IF NOT EXISTS `consent_logs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `anonymous_id` VARCHAR(191) NOT NULL,
    `categories` JSON NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'sdk',
    `ip_hash` VARCHAR(191) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `consent_logs_project_id_idx`(`project_id`),
    INDEX `consent_logs_anonymous_id_idx`(`anonymous_id`),
    INDEX `consent_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE LOGS E AUDITORIA
-- ============================================

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
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_tenant_id_idx`(`tenant_id`),
    INDEX `audit_logs_actor_user_id_idx`(`actor_user_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de logs de erros
CREATE TABLE IF NOT EXISTS `error_logs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `error_logs_project_id_idx`(`project_id`),
    INDEX `error_logs_type_idx`(`type`),
    INDEX `error_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE EXPORTAÇÃO
-- ============================================

-- Tabela de jobs de exportação
CREATE TABLE IF NOT EXISTS `export_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `type` ENUM('EVENTS_RAW', 'EVENTS_AGG', 'FUNNEL', 'REVENUE') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `params` JSON NOT NULL,
    `file_url` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finished_at` DATETIME(3) NULL,

    INDEX `export_jobs_project_id_idx`(`project_id`),
    INDEX `export_jobs_status_idx`(`status`),
    INDEX `export_jobs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- TABELAS DE BILLING (STRIPE)
-- ============================================

-- Tabela de planos
CREATE TABLE IF NOT EXISTS `plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tier` ENUM('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE') NOT NULL,
    `description` TEXT NULL,
    `monthly_price` INTEGER NOT NULL,
    `yearly_price` INTEGER NOT NULL,
    `stripe_price_id_monthly` VARCHAR(191) NULL,
    `stripe_price_id_yearly` VARCHAR(191) NULL,
    `max_projects` INTEGER NOT NULL DEFAULT 1,
    `max_events_per_month` INTEGER NOT NULL DEFAULT 10000,
    `max_team_members` INTEGER NOT NULL DEFAULT 1,
    `retention_days` INTEGER NOT NULL DEFAULT 30,
    `features` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plans_tier_key`(`tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `status` ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED') NOT NULL DEFAULT 'TRIALING',
    `stripe_customer_id` VARCHAR(191) NULL,
    `stripe_subscription_id` VARCHAR(191) NULL,
    `billing_interval` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `current_period_start` DATETIME(3) NULL,
    `current_period_end` DATETIME(3) NULL,
    `trial_start` DATETIME(3) NULL,
    `trial_end` DATETIME(3) NULL,
    `cancel_at_period_end` BOOLEAN NOT NULL DEFAULT false,
    `canceled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_tenant_id_key`(`tenant_id`),
    UNIQUE INDEX `subscriptions_stripe_subscription_id_key`(`stripe_subscription_id`),
    INDEX `subscriptions_plan_id_idx`(`plan_id`),
    INDEX `subscriptions_stripe_customer_id_idx`(`stripe_customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NOT NULL,
    `stripe_invoice_id` VARCHAR(191) NULL,
    `amount_due` INTEGER NOT NULL,
    `amount_paid` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'brl',
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',
    `invoice_url` TEXT NULL,
    `invoice_pdf` TEXT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `due_date` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_stripe_invoice_id_key`(`stripe_invoice_id`),
    INDEX `invoices_subscription_id_idx`(`subscription_id`),
    INDEX `invoices_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de registros de uso
CREATE TABLE IF NOT EXISTS `usage_records` (
    `id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NOT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `events_count` INTEGER NOT NULL DEFAULT 0,
    `projects_count` INTEGER NOT NULL DEFAULT 0,
    `team_members_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `usage_records_subscription_id_idx`(`subscription_id`),
    UNIQUE INDEX `usage_records_subscription_id_period_start_key`(`subscription_id`, `period_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- FOREIGN KEYS (RELACIONAMENTOS)
-- ============================================

-- Refresh tokens -> Users
ALTER TABLE `refresh_tokens`
ADD CONSTRAINT `refresh_tokens_user_id_fkey`
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Memberships -> Users
ALTER TABLE `memberships`
ADD CONSTRAINT `memberships_user_id_fkey`
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Memberships -> Tenants
ALTER TABLE `memberships`
ADD CONSTRAINT `memberships_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Projects -> Tenants
ALTER TABLE `projects`
ADD CONSTRAINT `projects_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- API Keys -> Projects
ALTER TABLE `api_keys`
ADD CONSTRAINT `api_keys_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrations Meta -> Projects
ALTER TABLE `integrations_meta`
ADD CONSTRAINT `integrations_meta_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Consent Logs -> Projects
ALTER TABLE `consent_logs`
ADD CONSTRAINT `consent_logs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Audit Logs -> Tenants
ALTER TABLE `audit_logs`
ADD CONSTRAINT `audit_logs_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Audit Logs -> Users (actor)
ALTER TABLE `audit_logs`
ADD CONSTRAINT `audit_logs_actor_user_id_fkey`
FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Error Logs -> Projects
ALTER TABLE `error_logs`
ADD CONSTRAINT `error_logs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Lead Integrations -> Projects
ALTER TABLE `lead_integrations`
ADD CONSTRAINT `lead_integrations_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Lead Form Configs -> Projects
ALTER TABLE `lead_form_configs`
ADD CONSTRAINT `lead_form_configs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Lead Notification Configs -> Projects
ALTER TABLE `lead_notification_configs`
ADD CONSTRAINT `lead_notification_configs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Export Jobs -> Projects
ALTER TABLE `export_jobs`
ADD CONSTRAINT `export_jobs_project_id_fkey`
FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscriptions -> Tenants
ALTER TABLE `subscriptions`
ADD CONSTRAINT `subscriptions_tenant_id_fkey`
FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscriptions -> Plans
ALTER TABLE `subscriptions`
ADD CONSTRAINT `subscriptions_plan_id_fkey`
FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invoices -> Subscriptions
ALTER TABLE `invoices`
ADD CONSTRAINT `invoices_subscription_id_fkey`
FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Usage Records -> Subscriptions
ALTER TABLE `usage_records`
ADD CONSTRAINT `usage_records_subscription_id_fkey`
FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- SEED DATA - PLANOS PADRÃO
-- ============================================

-- Inserir planos padrão (com preços em centavos BRL)
INSERT INTO `plans` (`id`, `name`, `tier`, `description`, `monthly_price`, `yearly_price`, `max_projects`, `max_events_per_month`, `max_team_members`, `retention_days`, `features`, `is_active`, `created_at`, `updated_at`) VALUES
('plan_free', 'Free', 'FREE', 'Comece com analytics básico', 0, 0, 1, 10000, 1, 30, '["basic_analytics", "single_project", "30_day_retention", "community_support"]', true, NOW(), NOW()),
('plan_starter', 'Starter', 'STARTER', 'Para pequenas equipes', 2900, 29000, 3, 100000, 5, 90, '["basic_analytics", "advanced_funnels", "multiple_projects", "90_day_retention", "email_support", "api_access", "csv_export"]', true, NOW(), NOW()),
('plan_professional', 'Professional', 'PROFESSIONAL', 'Para empresas em crescimento', 7900, 79000, 10, 1000000, 20, 365, '["basic_analytics", "advanced_funnels", "multiple_projects", "365_day_retention", "priority_support", "api_access", "csv_export", "integrations", "custom_reports", "mfa_support", "audit_logs", "gdpr_tools"]', true, NOW(), NOW()),
('plan_enterprise', 'Enterprise', 'ENTERPRISE', 'Para grandes organizações', 19900, 199000, -1, -1, -1, 730, '["basic_analytics", "advanced_funnels", "unlimited_projects", "2_year_retention", "dedicated_support", "api_access", "csv_export", "integrations", "custom_reports", "mfa_support", "audit_logs", "gdpr_tools", "sso_saml", "custom_branding", "sla_guarantee", "dedicated_infrastructure", "onboarding"]', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT 'Database criado com sucesso!' AS status;
SELECT COUNT(*) AS total_tabelas FROM information_schema.tables WHERE table_schema = 'trackpro';
