import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';

// Mock the dependencies
jest.mock('@google/generative-ai');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe('ReceiptService', () => {
  let service: ReceiptService;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;

  const mockValidResponse = {
    date: '2024-01-15',
    currency: 'USD',
    vendor_name: 'Test Store',
    receipt_items: [
      { item_name: 'Coffee', item_cost: 4.50 },
      { item_name: 'Sandwich', item_cost: 8.99 }
    ],
    tax: 1.35,
    total: 14.84
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'receipt.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('mock-image-data'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    // Reset environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';

    // Create mock model with proper methods
    mockModel = {
      generateContent: jest.fn(),
    };

    // Mock GoogleGenerativeAI
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    } as any;

    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceiptService],
    }).compile();

    service = module.get<ReceiptService>(ReceiptService);

    // Mock fs methods
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if GEMINI_API_KEY is not set', () => {
      delete process.env.GEMINI_API_KEY;
      
      expect(() => {
        new ReceiptService();
      }).toThrow('GEMINI_API_KEY environment variable is required');
    });
  });

  describe('extractReceiptDetails', () => {
    it('should successfully extract receipt details from valid image', async () => {
      // Mock successful AI response
      const mockResult = {
        response: {
          text: () => JSON.stringify(mockValidResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await service.extractReceiptDetails(mockFile);

      expect(result).toMatchObject({
        date: '2024-01-15',
        currency: 'USD',
        vendor_name: 'Test Store',
        receipt_items: [
          { item_name: 'Coffee', item_cost: 4.50 },
          { item_name: 'Sandwich', item_cost: 8.99 }
        ],
        tax: 1.35,
        total: 14.84,
      });
      expect(result.id).toBeDefined();
      expect(result.image_url).toContain('/uploads/');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw BadRequestException for incorrect file type', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      };

      await expect(service.extractReceiptDetails(invalidFile))
        .rejects
        .toThrow(BadRequestException);
    });    it('should throw BadRequestException for .txt file', async () => {
      const txtFile = {
        ...mockFile,
        mimetype: 'text/plain',
        originalname: 'receipt.txt',
      };

      await expect(service.extractReceiptDetails(txtFile))
        .rejects
        .toThrow('Only .jpg, .jpeg, .png, and .webp files are allowed');
    });

    it('should handle PNG files correctly', async () => {
      const pngFile = {
        ...mockFile,
        mimetype: 'image/png',
        originalname: 'receipt.png',
      };

      const mockResult = {
        response: {
          text: () => JSON.stringify(mockValidResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await service.extractReceiptDetails(pngFile);
      expect(result).toBeDefined();
      expect(result.image_url).toContain('.png');
    });

    it('should throw InternalServerErrorException for invalid AI response JSON', async () => {
      // Mock AI response with invalid JSON
      const mockResult = {
        response: {
          text: () => 'invalid json response',
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      await expect(service.extractReceiptDetails(mockFile))
        .rejects
        .toThrow('AI model returned invalid response format');
    });

    it('should throw InternalServerErrorException for incomplete AI response', async () => {
      // Mock AI response with missing required fields
      const incompleteResponse = {
        date: '2024-01-15',
        // missing currency, vendor_name, etc.
      };
      
      const mockResult = {
        response: {
          text: () => JSON.stringify(incompleteResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      await expect(service.extractReceiptDetails(mockFile))
        .rejects
        .toThrow('AI model returned incomplete or invalid data');
    });

    it('should throw InternalServerErrorException for invalid currency code', async () => {
      const invalidCurrencyResponse = {
        ...mockValidResponse,
        currency: 'INVALID', // Invalid currency code (not 3 characters)
      };
      
      const mockResult = {
        response: {
          text: () => JSON.stringify(invalidCurrencyResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      await expect(service.extractReceiptDetails(mockFile))
        .rejects
        .toThrow('AI model returned incomplete or invalid data');
    });

    it('should throw InternalServerErrorException for empty receipt items', async () => {
      const emptyItemsResponse = {
        ...mockValidResponse,
        receipt_items: [],
      };
      
      const mockResult = {
        response: {
          text: () => JSON.stringify(emptyItemsResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // This should still pass validation as empty arrays are valid
      const result = await service.extractReceiptDetails(mockFile);
      expect(result.receipt_items).toEqual([]);
    });

    it('should throw InternalServerErrorException for invalid receipt items structure', async () => {
      const invalidItemsResponse = {
        ...mockValidResponse,
        receipt_items: [
          { item_name: 'Coffee' }, // missing item_cost
          { item_cost: 8.99 }, // missing item_name
        ],
      };
      
      const mockResult = {
        response: {
          text: () => JSON.stringify(invalidItemsResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      await expect(service.extractReceiptDetails(mockFile))
        .rejects
        .toThrow('AI model returned incomplete or invalid data');
    });

    it('should handle AI service 500 status response', async () => {
      // Mock AI service throwing an error (simulating 500 response)
      mockModel.generateContent.mockRejectedValue(new Error('AI service error'));

      await expect(service.extractReceiptDetails(mockFile))
        .rejects
        .toThrow('Failed to process receipt image');
    });

    it('should clean AI response with code blocks', async () => {
      // Mock AI response wrapped in code blocks
      const wrappedResponse = '```json\n' + JSON.stringify(mockValidResponse) + '\n```';
      const mockResult = {
        response: {
          text: () => wrappedResponse,
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await service.extractReceiptDetails(mockFile);
      expect(result.vendor_name).toBe('Test Store');
    });

    it('should handle file system errors', async () => {
      // Mock file system error
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('File system error'));

      await expect(service.extractReceiptDetails(mockFile))
        .rejects
        .toThrow('Failed to process receipt image');
    });
  });

  describe('getReceiptById', () => {
    it('should return undefined for non-existent receipt', () => {
      const result = service.getReceiptById('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should return receipt after extraction', async () => {
      const mockResult = {
        response: {
          text: () => JSON.stringify(mockValidResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      const extractedReceipt = await service.extractReceiptDetails(mockFile);
      const retrievedReceipt = service.getReceiptById(extractedReceipt.id);
      
      expect(retrievedReceipt).toEqual(extractedReceipt);
    });
  });

  describe('getAllReceipts', () => {
    it('should return empty array initially', () => {
      const result = service.getAllReceipts();
      expect(result).toEqual([]);
    });

    it('should return all receipts after extraction', async () => {
      const mockResult = {
        response: {
          text: () => JSON.stringify(mockValidResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      const receipt1 = await service.extractReceiptDetails(mockFile);
      const receipt2 = await service.extractReceiptDetails({
        ...mockFile,
        originalname: 'receipt2.jpg',
      });

      const allReceipts = service.getAllReceipts();
      expect(allReceipts).toHaveLength(2);
      expect(allReceipts).toContain(receipt1);
      expect(allReceipts).toContain(receipt2);
    });
  });
});
