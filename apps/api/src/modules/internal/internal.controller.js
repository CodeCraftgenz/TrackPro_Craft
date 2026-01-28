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
exports.InternalController = void 0;
const common_1 = require("@nestjs/common");
const internal_service_1 = require("./internal.service");
let InternalController = class InternalController {
    internalService;
    constructor(internalService) {
        this.internalService = internalService;
    }
    async validateApiKey(internalSecret, body) {
        this.internalService.validateInternalRequest(internalSecret);
        const result = await this.internalService.validateApiKey(body.apiKey);
        if (!result) {
            throw new common_1.NotFoundException('API key not found or inactive');
        }
        return result;
    }
};
exports.InternalController = InternalController;
__decorate([
    (0, common_1.Post)('validate-api-key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-internal-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InternalController.prototype, "validateApiKey", null);
exports.InternalController = InternalController = __decorate([
    (0, common_1.Controller)('internal'),
    __metadata("design:paramtypes", [internal_service_1.InternalService])
], InternalController);
//# sourceMappingURL=internal.controller.js.map