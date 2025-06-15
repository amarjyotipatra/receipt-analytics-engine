import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReceiptModule } from './receipt/receipt.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [ReceiptModule, TestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
