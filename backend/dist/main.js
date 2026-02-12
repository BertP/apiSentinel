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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    try {
        let yamlPath = path.join(process.cwd(), 'openapi.yaml');
        if (!fs.existsSync(yamlPath)) {
            yamlPath = path.join(process.cwd(), '..', 'openapi.yaml');
        }
        if (fs.existsSync(yamlPath)) {
            const fileContent = fs.readFileSync(yamlPath, 'utf8');
            const document = yaml.load(fileContent);
            swagger_1.SwaggerModule.setup('docs', app, document);
            new common_1.Logger('Swagger').log('Swagger UI initialized at /docs');
        }
        else {
            new common_1.Logger('Swagger').warn('openapi.yaml not found, skipping Swagger UI setup');
        }
    }
    catch (err) {
        new common_1.Logger('Swagger').error('Failed to initialize Swagger UI', err.stack);
    }
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map