"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const openapi_parser_service_1 = require("./monitor/openapi-parser/openapi-parser.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const parser = app.get(openapi_parser_service_1.OpenapiParserService);
    const logger = new common_1.Logger('Bootstrap');
    try {
        const api = await parser.parseDefinition('openapi.yaml');
        const endpoints = parser.extractEndpoints(api);
        logger.log(`Detected ${endpoints.length} endpoints:`);
        endpoints.forEach(e => logger.log(`- ${e.method} ${e.path} (${e.summary})`));
    }
    catch (err) {
        logger.error('Failed to parse openapi.yaml on startup');
    }
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map