import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqService } from './groq.service';
import { LlmService } from './llm.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GroqService, LlmService],
  exports: [GroqService, LlmService],
})
export class LlmModule {}
