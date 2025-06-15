import { Controller, Get, Post, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReceiptService } from '../receipt/receipt.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('test')
export class TestController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get('sample-receipts')
  getSampleReceipts() {
    const sampleReceiptsDir = path.join(process.cwd(), 'sample-receipts');
    try {
      const files = fs.readdirSync(sampleReceiptsDir);
      return {
        message: 'Available sample receipt files',
        files: files.filter(file => 
          file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/)
        ),
        usage: 'POST /test/process-sample/:filename to process a sample receipt'
      };
    } catch (error) {
      return {
        message: 'Sample receipts directory not found',
        files: []
      };
    }
  }

  @Post('process-sample/:filename')
  async processSampleReceipt(@Param('filename') filename: string) {
    const sampleReceiptsDir = path.join(process.cwd(), 'sample-receipts');
    const filePath = path.join(sampleReceiptsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Sample receipt '${filename}' not found`);
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    
    // Determine mimetype based on extension
    const ext = path.extname(filename).toLowerCase();
    let mimetype: string;
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimetype = 'image/jpeg';
        break;
      case '.png':
        mimetype = 'image/png';
        break;
      case '.webp':
        mimetype = 'image/webp';
        break;
      default:
        throw new BadRequestException('Unsupported file type');
    }

    // Create mock Multer file object
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: mimetype,
      size: stats.size,
      buffer: buffer,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Process the receipt
    try {
      const result = await this.receiptService.extractReceiptDetails(mockFile);
      return {
        message: `Successfully processed sample receipt: ${filename}`,
        result: result
      };
    } catch (error) {
      return {
        message: `Failed to process sample receipt: ${filename}`,
        error: error.message
      };
    }
  }

  @Get('receipts')
  getAllReceipts() {
    return {
      message: 'All processed receipts',
      receipts: this.receiptService.getAllReceipts()
    };
  }

  @Get('receipts/:id')
  getReceiptById(@Param('id') id: string) {
    const receipt = this.receiptService.getReceiptById(id);
    if (!receipt) {
      throw new BadRequestException(`Receipt with ID '${id}' not found`);
    }
    return receipt;
  }
}
