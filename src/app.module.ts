import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './module/auth/auth.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
