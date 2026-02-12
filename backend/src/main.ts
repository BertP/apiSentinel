import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function bootstrap() {
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
      const document = yaml.load(fileContent) as any;
      SwaggerModule.setup('docs', app, document);
      new Logger('Swagger').log('Swagger UI initialized at /docs');
    } else {
      new Logger('Swagger').warn('openapi.yaml not found, skipping Swagger UI setup');
    }
  } catch (err) {
    new Logger('Swagger').error('Failed to initialize Swagger UI', err.stack);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
