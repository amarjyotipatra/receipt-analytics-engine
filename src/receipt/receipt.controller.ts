import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReceiptService } from './receipt.service';
import { ReceiptResponse } from './dto/receipt-response.dto';

@Controller('receipt')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post('extract-receipt-details')
  @HttpCode(HttpStatus.OK)  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, callback) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Only .jpg, .jpeg, .png, and .webp files are allowed'), false);
      }
    },
  }))
  async extractReceiptDetails(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ReceiptResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.receiptService.extractReceiptDetails(file);
  }
}
