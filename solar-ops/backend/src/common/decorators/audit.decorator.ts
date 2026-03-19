import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

// Re-export for convenience
export { AuditLog } from './audit.decorator';
