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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OpenapiParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenapiParserService = void 0;
const common_1 = require("@nestjs/common");
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const path = __importStar(require("path"));
let OpenapiParserService = OpenapiParserService_1 = class OpenapiParserService {
    logger = new common_1.Logger(OpenapiParserService_1.name);
    async parseDefinition(filePath) {
        try {
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(process.cwd(), filePath);
            this.logger.log(`Parsing OpenAPI definition from: ${absolutePath}`);
            const api = await swagger_parser_1.default.parse(absolutePath);
            return api;
        }
        catch (error) {
            this.logger.error(`Error parsing OpenAPI definition: ${error.message}`);
            throw error;
        }
    }
    extractEndpoints(api) {
        const endpoints = [];
        if (!api || !api.paths)
            return endpoints;
        Object.keys(api.paths).forEach((pathKey) => {
            const pathItem = api.paths[pathKey];
            if (!pathItem)
                return;
            Object.keys(pathItem).forEach((method) => {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                    const operation = pathItem[method];
                    endpoints.push({
                        path: pathKey,
                        method: method.toUpperCase(),
                        summary: operation.summary || '',
                        operationId: operation.operationId,
                    });
                }
            });
        });
        return endpoints;
    }
};
exports.OpenapiParserService = OpenapiParserService;
exports.OpenapiParserService = OpenapiParserService = OpenapiParserService_1 = __decorate([
    (0, common_1.Injectable)()
], OpenapiParserService);
//# sourceMappingURL=openapi-parser.service.js.map