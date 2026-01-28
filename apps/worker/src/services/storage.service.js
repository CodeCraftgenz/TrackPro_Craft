"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let StorageService = StorageService_1 = class StorageService {
    configService;
    logger = new common_1.Logger(StorageService_1.name);
    storageType;
    localPath;
    s3Bucket;
    s3Region;
    baseUrl;
    constructor(configService) {
        this.configService = configService;
        this.storageType = this.configService.get('STORAGE_TYPE', 'local');
        this.localPath = this.configService.get('STORAGE_LOCAL_PATH', './exports');
        this.s3Bucket = this.configService.get('STORAGE_S3_BUCKET');
        this.s3Region = this.configService.get('STORAGE_S3_REGION', 'us-east-1');
        this.baseUrl = this.configService.get('STORAGE_BASE_URL', 'http://localhost:3001/exports');
    }
    async uploadFile(key, content, options = {}) {
        if (this.storageType === 's3') {
            return this.uploadToS3(key, content, options);
        }
        return this.uploadToLocal(key, content);
    }
    async getFileUrl(key) {
        if (this.storageType === 's3') {
            return this.getS3Url(key);
        }
        return this.getLocalUrl(key);
    }
    async deleteFile(key) {
        if (this.storageType === 's3') {
            return this.deleteFromS3(key);
        }
        return this.deleteFromLocal(key);
    }
    async uploadToLocal(key, content) {
        const filePath = path.join(this.localPath, key);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        if (typeof content === 'string') {
            await fs.writeFile(filePath, content, 'utf-8');
        }
        else {
            await fs.writeFile(filePath, content);
        }
        this.logger.debug(`File uploaded locally: ${filePath}`);
        return this.getLocalUrl(key);
    }
    getLocalUrl(key) {
        return `${this.baseUrl}/${key}`;
    }
    async deleteFromLocal(key) {
        const filePath = path.join(this.localPath, key);
        try {
            await fs.unlink(filePath);
            this.logger.debug(`File deleted locally: ${filePath}`);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async uploadToS3(key, content, options = {}) {
        this.logger.warn('S3 storage not fully implemented, falling back to local');
        return this.uploadToLocal(key, content);
    }
    getS3Url(key) {
        return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
    }
    async deleteFromS3(key) {
        this.logger.warn('S3 delete not fully implemented');
    }
    async generateSignedUrl(key, expiresInSeconds = 3600) {
        if (this.storageType === 's3') {
            this.logger.warn('S3 signed URLs not fully implemented, returning public URL');
        }
        return this.getFileUrl(key);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map