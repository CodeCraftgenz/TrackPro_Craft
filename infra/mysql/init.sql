-- TrackPro MySQL Initialization Script
-- This script runs on first container startup

-- Ensure proper character set
ALTER DATABASE trackpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON trackpro.* TO 'trackpro'@'%';
FLUSH PRIVILEGES;

-- Note: Tables will be created by Prisma migrations
-- This file is for any additional setup needed
