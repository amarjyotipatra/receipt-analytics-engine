import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { ReceiptModule } from '../receipt/receipt.module';

@Module({
  imports: [ReceiptModule],
  controllers: [TestController],
})
export class TestModule {}
