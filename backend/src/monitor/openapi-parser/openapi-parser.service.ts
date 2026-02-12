import { Injectable, Logger } from '@nestjs/common';
import SwaggerParser from '@apidevtools/swagger-parser';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class OpenapiParserService {
    private readonly logger = new Logger(OpenapiParserService.name);

    async parseDefinition(filePath: string): Promise<any> {
        try {
            let absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(process.cwd(), filePath);

            // Support looking in parent directory (root from backend/)
            if (!fs.existsSync(absolutePath)) {
                const parentPath = path.join(process.cwd(), '..', filePath);
                if (fs.existsSync(parentPath)) {
                    absolutePath = parentPath;
                }
            }

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
                        summary: operation.summary || operation.description || '',
                        operationId: operation.operationId,
                    });
                }
            });
        });

        return endpoints;
    }
}
