import { Injectable, Logger } from '@nestjs/common';
import SwaggerParser from '@apidevtools/swagger-parser';
import * as path from 'path';

@Injectable()
export class OpenapiParserService {
    private readonly logger = new Logger(OpenapiParserService.name);

    async parseDefinition(filePath: string): Promise<any> {
        try {
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(process.cwd(), filePath);

            this.logger.log(`Parsing OpenAPI definition from: ${absolutePath}`);
            const api = await SwaggerParser.parse(absolutePath);
            return api;
        } catch (error) {
            this.logger.error(`Error parsing OpenAPI definition: ${error.message}`);
            throw error;
        }
    }

    extractEndpoints(api: any) {
        const endpoints: any[] = [];
        if (!api || !api.paths) return endpoints;

        Object.keys(api.paths).forEach((pathKey) => {
            const pathItem = api.paths[pathKey];
            if (!pathItem) return;

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
}
