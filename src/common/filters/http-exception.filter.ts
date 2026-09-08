import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ErrorResponseDto } from '../dto/error-response.dto';

interface NestExceptionBody {
  message?: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorResponseDto = {
      statusCode: status,
      error: this.resolveError(exception, status),
      message: this.resolveMessage(exception, status),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    const details = this.resolveDetails(exception);
    if (details) {
      body.details = details;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.originalUrl} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private resolveError(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (this.isExceptionBody(payload) && typeof payload.error === 'string') {
        return payload.error;
      }
    }

    return HttpStatus[status] ? this.toTitleCase(HttpStatus[status] as string) : 'Error';
  }

  private resolveMessage(exception: unknown, status: number): string {
    // Never surface an unexpected error's message; it can leak internals.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error';
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return payload;
      }

      if (this.isExceptionBody(payload)) {
        if (typeof payload.message === 'string') {
          return payload.message;
        }
        if (Array.isArray(payload.message) && payload.message.length > 0) {
          return payload.message[0];
        }
      }

      return exception.message;
    }

    return 'Unexpected error';
  }

  private resolveDetails(exception: unknown): string[] | undefined {
    if (!(exception instanceof HttpException)) {
      return undefined;
    }

    const payload = exception.getResponse();
    if (this.isExceptionBody(payload) && Array.isArray(payload.message)) {
      return payload.message;
    }

    return undefined;
  }

  private isExceptionBody(payload: unknown): payload is NestExceptionBody {
    return typeof payload === 'object' && payload !== null;
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
