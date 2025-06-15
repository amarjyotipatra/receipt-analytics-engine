import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ReceiptResponse } from './dto/receipt-response.dto';
import { GeminiReceiptData } from './interfaces/gemini-receipt.interface';

@Injectable()
export class ReceiptService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private uploadsDir = path.join(process.cwd(), 'uploads');
  private receiptsData: Map<string, ReceiptResponse> = new Map();

  constructor() {
    // Initialize Gemini AI - you'll need to set GEMINI_API_KEY environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Ensure uploads directory exists
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }
  async extractReceiptDetails(file: Express.Multer.File): Promise<ReceiptResponse> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only .jpg, .jpeg, .png, and .webp files are allowed');
    }

    try {
      // Generate unique ID for this receipt
      const receiptId = uuidv4();
      
      // Save the uploaded file
      const fileName = `${receiptId}_${file.originalname}`;
      const filePath = path.join(this.uploadsDir, fileName);
      await fs.writeFile(filePath, file.buffer);

      // Convert image to base64
      const imageBase64 = file.buffer.toString('base64');
      
      // Create prompt for Gemini
      const prompt = `
        Analyze this receipt image and extract the following information in JSON format:
        
        {
          "date": "YYYY-MM-DD format",
          "currency": "3-character currency code (e.g., USD, EUR, CAD)",
          "vendor_name": "Name of the store/vendor",
          "receipt_items": [
            {
              "item_name": "Name of the item",
              "item_cost": 0.00
            }
          ],
          "tax": 0.00,
          "total": 0.00
        }
        
        Please ensure:
        1. The date is in YYYY-MM-DD format
        2. Currency is a valid 3-character code
        3. All monetary values are numbers (not strings)
        4. Tax is the total GST/tax amount for the entire receipt
        5. Total is the final amount paid
        6. Item costs should be individual item prices before tax
        
        Return only the JSON object, no additional text.
      `;

      // Send image and prompt to Gemini
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: file.mimetype,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      let extractedData: GeminiReceiptData;
      try {
        // Clean the response text and parse JSON
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        extractedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new InternalServerErrorException('AI model returned invalid response format');
      }

      // Validate the extracted data
      if (!this.validateExtractedData(extractedData)) {
        throw new InternalServerErrorException('AI model returned incomplete or invalid data');
      }

      // Create the receipt response
      const receiptResponse: ReceiptResponse = {
        id: receiptId,
        date: extractedData.date,
        currency: extractedData.currency,
        vendor_name: extractedData.vendor_name,
        receipt_items: extractedData.receipt_items,
        tax: extractedData.tax,
        total: extractedData.total,
        image_url: `/uploads/${fileName}`,
      };

      // Store the receipt data (in a real app, this would be in a database)
      this.receiptsData.set(receiptId, receiptResponse);

      return receiptResponse;

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Error processing receipt:', error);
      throw new InternalServerErrorException('Failed to process receipt image');
    }
  }

  private validateExtractedData(data: any): data is GeminiReceiptData {
    return (
      data &&
      typeof data.date === 'string' &&
      typeof data.currency === 'string' &&
      typeof data.vendor_name === 'string' &&
      Array.isArray(data.receipt_items) &&
      data.receipt_items.every((item: any) => 
        typeof item.item_name === 'string' && 
        typeof item.item_cost === 'number'
      ) &&
      typeof data.tax === 'number' &&
      typeof data.total === 'number' &&
      data.currency.length === 3
    );
  }

  // Method to get a receipt by ID (useful for testing and future endpoints)
  getReceiptById(id: string): ReceiptResponse | undefined {
    return this.receiptsData.get(id);
  }

  // Method to get all receipts (useful for testing and future endpoints)
  getAllReceipts(): ReceiptResponse[] {
    return Array.from(this.receiptsData.values());
  }
}
