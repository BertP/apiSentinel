import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();

    // Swagger Setup
    try {
      let yamlPath = path.join(process.cwd(), 'openapi.yaml');
      if (!fs.existsSync(yamlPath)) {
        yamlPath = path.join(process.cwd(), '..', 'openapi.yaml');
      }

      if (fs.existsSync(yamlPath)) {
        const fileContent = fs.readFileSync(yamlPath, 'utf8');
        const document = yaml.load(fileContent) as Record<string, unknown>;
        SwaggerModule.setup('docs', app, document as any);
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
