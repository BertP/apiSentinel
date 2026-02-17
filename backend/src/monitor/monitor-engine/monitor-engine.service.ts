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
    manualData?: any,
  ) {
    const config = this.configService.getConfig();
    const deviceId = config.deviceId || 'TRIAL_DEVICE_ID';

    // Replace {deviceId} parameter
    const pathWithParams = endpoint.path.replace('{deviceId}', deviceId);
    const url = `${baseUrl}${pathWithParams}`;
    const startTime = Date.now();
    let data: any = manualData;

    try {
      this.logger.log(`Checking endpoint: ${endpoint.method} ${url}`);

      const token = await this.oauthManager.getAccessToken();
      const headers = {
        'User-Agent': 'API-Sentinel/v0.0.1',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Handle PUT body
      if (endpoint.method.toUpperCase() === 'PUT' && data === undefined) {
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
        data: response.data,
        requestData: data,
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
        requestData: data,
      };
    }
  }

  async getAccountOverview(baseUrl: string) {
    try {
      this.logger.log('Fetching account overview from /devices...');
      const token = await this.oauthManager.getAccessToken();
      const headers = {
        'User-Agent': 'API-Sentinel/v0.0.1',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/devices`, { headers, timeout: 10000 })
      );

      const devices = response.data;
      return Object.entries(devices).map(([deviceId, data]: [string, any]) => ({
        deviceId,
        typeRaw: data.ident?.type?.value_raw,
        typeLocalized: data.ident?.type?.value_localized,
        fabNumber: data.ident?.deviceIdentLabel?.fabNumber,
        protocolVersion: data.ident?.protocolVersion,
        deviceName: data.ident?.deviceName,
        techType: data.ident?.deviceIdentLabel?.techType,
      }));
    } catch (err) {
      this.logger.error(`Failed to fetch account overview: ${err.message}`);
      throw err;
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
      this.logger.warn(`Validation engine error for ${method} ${path}: ${err.message}`, err.stack);
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
        // Prioritize processAction if available
        const priorityKeys = ['processAction', 'processaction'];
        for (const key of priorityKeys) {
          if (content.examples[key]) {
            const ex = content.examples[key] as any;
            if (ex.value) {
              // Fix: skip or adjust the invalid processAction: 1 which causes 402 errors
              if (ex.value.processAction === 1) {
                this.logger.warn(`Skipping invalid processAction: 1 example found in spec. Using 4 (SuperFreezing) as a safer default.`);
                return { processAction: 4 };
              }
              return ex.value;
            }
          }
        }

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
