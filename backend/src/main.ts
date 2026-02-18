import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalFilters(new HttpExceptionFilter());

    // Swagger Setup
    try {
      let yamlPath = path.join(process.cwd(), 'openapi.yaml');
      if (!fs.existsSync(yamlPath)) {
        yamlPath = path.join(process.cwd(), '..', 'openapi.yaml');
      }

      if (fs.existsSync(yamlPath)) {
        const fileContent = fs.readFileSync(yamlPath, 'utf8');
        const document = yaml.load(fileContent) as Record<string, unknown>;

        // Custom CSS for Dark Theme
        const customCss = `
          .swagger-ui { background-color: #0f172a; color: #f8fafc; filter: invert(88%) hue-rotate(180deg) brightness(1.1) contrast(0.9); }
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info .title { color: #000; }
          .swagger-ui .opblock-tag { border-bottom: 1px solid #cbd5e1; }
          .swagger-ui .opblock { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        `;
        // Note: The filter approach is a quick way to dark-mode standard Swagger, 
        // but for high precision we use specific overrides if needed.
        // Let's use a cleaner approach with specific slate-900/blue-600 colors.

        const betterCustomCss = `
          body { background-color: #0f172a; margin: 0; }
          .swagger-ui { background-color: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif; }
          .swagger-ui .topbar { background-color: #0f172a; border-bottom: 1px solid #1e293b; padding: 20px 0; }
          .swagger-ui .info .title, .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .opblock-tag, .swagger-ui .opblock .opblock-summary-path { color: #f8fafc !important; }
          .swagger-ui .scheme-container { background-color: #0f172a; box-shadow: none; border-bottom: 1px solid #1e293b; }
          .swagger-ui select, .swagger-ui input { background-color: #1e293b !important; color: #f8fafc !important; border: 1px solid #334155 !important; }
          .swagger-ui .opblock { background: #1e293b !important; border: 1px solid #334155 !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
          .swagger-ui .opblock .opblock-summary { border-bottom: 1px solid #334155; }
          .swagger-ui .opblock-section-header { background: #0f172a !important; }
          .swagger-ui .tabli button { color: #f8fafc !important; }
          .swagger-ui .response-col_status, .swagger-ui .response-col_description { color: #f8fafc !important; }
          .swagger-ui .btn.execute { background-color: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }
          .swagger-ui .btn.authorize { color: #3b82f6 !important; border-color: #3b82f6 !important; }
          .swagger-ui .btn.authorize svg { fill: #3b82f6 !important; }
          .swagger-ui section.models { border: 1px solid #1e293b !important; }
          .swagger-ui section.models.is-open { padding: 0 20px 20px; }
          .swagger-ui section.models .model-container { background: #0f172a !important; margin: 0; }
          .swagger-ui .model-title { color: #f8fafc !important; }
          .swagger-ui .model { color: #94a3b8 !important; }
          .swagger-ui .prop-type { color: #60a5fa !important; }
          .swagger-ui .prop-format { color: #475569 !important; }
        `;

        SwaggerModule.setup('docs', app, document as any, {
          customCss: betterCustomCss,
          customSiteTitle: 'API Sentinel Documentation',
        });
        new Logger('Swagger').log('Swagger UI initialized at /docs');
      } else {
        new Logger('Swagger').warn(
          'openapi.yaml not found, skipping Swagger UI setup',
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      new Logger('Swagger').error('Failed to initialize Swagger UI', error.stack);
    }

    const port = process.env.PORT ?? 3000;
    // CRITICAL: Bind to 0.0.0.0 for Docker networking
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: http://0.0.0.0:${port}`);
  } catch (err) {
    logger.error(`CRITICAL STARTUP ERROR: ${err.message}`, err.stack);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('FATAL ERROR DURING BOOTSTRAP:', err);
  process.exit(1);
});
