import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OauthManagerService } from '../oauth-manager/oauth-manager.service';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { MonitorConfigService } from '../monitor-config.service';

@Injectable()
export class MonitorEngineService {
  private readonly logger = new Logger(MonitorEngineService.name);
  private ajv: Ajv;
  private apiDefinition: any = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly oauthManager: OauthManagerService,
    private readonly configService: MonitorConfigService,
  ) {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  setDefinition(api: any) {
    this.apiDefinition = api;
    this.logger.log('OpenAPI definition synchronized with MonitorEngine');
  }

  async checkEndpoint(
    baseUrl: string,
    endpoint: { path: string; method: string },
  ) {
    const config = this.configService.getConfig();
    const deviceId = config.deviceId || 'TRIAL_DEVICE_ID';

    // Replace {deviceId} parameter
    const pathWithParams = endpoint.path.replace('{deviceId}', deviceId);
    const url = `${baseUrl}${pathWithParams}`;
    const startTime = Date.now();

    try {
      this.logger.log(`Checking endpoint: ${endpoint.method} ${url}`);

      const token = await this.oauthManager.getAccessToken();
      const headers = {
        'User-Agent': 'API-Sentinel/v0.0.1',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Handle PUT body
      let data: any = undefined;
      if (endpoint.method.toUpperCase() === 'PUT') {
        data = this.generateSampleBody(endpoint.path, endpoint.method);
        this.logger.log(`Generated PUT body: ${JSON.stringify(data)}`);
      }

      const response = await firstValueFrom(
        this.httpService.request({
          url,
          method: endpoint.method as any,
          headers,
          data,
          timeout: 10000,
        }),
      );

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Payload Validation
      const validation = this.validateResponse(
        endpoint.path,
        endpoint.method,
        response.status,
        response.data,
      );

      this.logger.log(
        `Result: ${response.status} - ${latency}ms - Valid: ${validation.success}`,
      );

      return {
        status: response.status,
        latency,
        success: response.status >= 200 && response.status < 300,
        validationResult: validation.details,
        validationError: validation.error,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const latency = endTime - startTime;
      const status = error.response?.status || 500;
      const errorData = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;

      this.logger.error(`Failed: ${status} - ${errorData}`);

      return {
        status,
        latency,
        success: false,
        error: error.message,
      };
    }
  }

  private validateResponse(
    path: string,
    method: string,
    status: number,
    data: any,
  ) {
    if (!this.apiDefinition) {
      return { success: true, details: { info: 'No definition loaded' } };
    }

    try {
      const pathItem = this.apiDefinition.paths[path];
      if (!pathItem) return { success: true, details: { info: 'Path not in spec' } };

      const operation = pathItem[method.toLowerCase()];
      if (!operation) return { success: true, details: { info: 'Method not in spec' } };

      const responseSpec = operation.responses[status.toString()] || operation.responses['default'];
      if (!responseSpec || !responseSpec.content) {
        return { success: true, details: { info: 'No response schema defined' } };
      }

      const jsonSchema = responseSpec.content['application/json']?.schema;
      if (!jsonSchema) {
        return { success: true, details: { info: 'No JSON schema found' } };
      }

      // We need to handle refs if they aren't fully resolved, 
      // but SwaggerParser.parse usually resolves them.
      const validate = this.ajv.compile(jsonSchema);
      const valid = validate(data);

      if (!valid) {
        return {
          success: false,
          error: this.ajv.errorsText(validate.errors),
          details: validate.errors,
        };
      }

      return { success: true, details: { info: 'Validated' } };
    } catch (err) {
      this.logger.warn('Validation engine error', err);
      return { success: true, details: { error: err.message } };
    }
  }

  private generateSampleBody(path: string, method: string): any {
    if (!this.apiDefinition) return {};

    try {
      const pathItem = this.apiDefinition.paths[path];
      if (!pathItem) return {};

      const operation = pathItem[method.toLowerCase()];
      if (!operation || !operation.requestBody) return {};

      const content = operation.requestBody.content['application/json'];
      if (!content) return {};

      // Try to find an example
      if (content.examples) {
        const firstExample = Object.values(content.examples)[0] as any;
        if (firstExample.value) return firstExample.value;
      }

      if (content.example) return content.example;

      // Fallback to minimal object
      return {};
    } catch (err) {
      return {};
    }
  }
}
