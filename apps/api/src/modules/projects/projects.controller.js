"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const projects_service_1 = require("./projects.service");
const api_keys_service_1 = require("./api-keys.service");
const projects_dto_1 = require("./dto/projects.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ProjectsController = class ProjectsController {
    projectsService;
    apiKeysService;
    constructor(projectsService, apiKeysService) {
        this.projectsService = projectsService;
        this.apiKeysService = apiKeysService;
    }
    async create(user, tenantId, dto) {
        return this.projectsService.create(tenantId, user.sub, dto);
    }
    async findAll(user, tenantId) {
        return this.projectsService.findAllForTenant(tenantId, user.sub);
    }
    async findOne(user, tenantId, id) {
        return this.projectsService.findById(id, tenantId, user.sub);
    }
    async update(user, tenantId, id, dto) {
        return this.projectsService.update(id, tenantId, user.sub, dto);
    }
    async delete(user, tenantId, id) {
        await this.projectsService.delete(id, tenantId, user.sub);
    }
    async createApiKey(user, tenantId, projectId, dto) {
        return this.apiKeysService.create(projectId, tenantId, user.sub, dto);
    }
    async listApiKeys(user, tenantId, projectId) {
        return this.apiKeysService.findAllForProject(projectId, tenantId, user.sub);
    }
    async revokeApiKey(user, tenantId, projectId, keyId) {
        await this.apiKeysService.revoke(keyId, projectId, tenantId, user.sub);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new project' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, projects_dto_1.CreateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all projects for tenant' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get project by ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update project' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, projects_dto_1.UpdateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete project' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/api-keys'),
    (0, swagger_1.ApiOperation)({ summary: 'Create API key for project' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, projects_dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Get)(':id/api-keys'),
    (0, swagger_1.ApiOperation)({ summary: 'List API keys for project' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "listApiKeys", null);
__decorate([
    (0, common_1.Delete)(':id/api-keys/:keyId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke API key' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Param)('keyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "revokeApiKey", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('projects'),
    (0, common_1.Controller)('tenants/:tenantId/projects'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        api_keys_service_1.ApiKeysService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map