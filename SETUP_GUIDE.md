# Receipt Extractor Backend - Setup Guide

This guide provides complete setup instructions for the Receipt Extractor Backend using Google Gemini AI.

## Prerequisites

- Node.js v18+ 
- npm v10+
- Google Gemini API Key

## Quick Setup

1. **Get a Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key for later use

2. **Environment Setup**
   ```bash
   # Copy the environment template
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   # GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start the Application**
   ```bash
   npm run start:dev
   ```

   The server will start on `http://localhost:3000`

## API Endpoints

### Main Endpoint
- **POST** `/receipt/extract-receipt-details`
  - Upload an image file to extract receipt details
  - Accepts: `.jpg`, `.jpeg`, `.png`, `.webp` files
  - Returns: Extracted receipt data with unique ID

### Test Endpoints (for development)
- **GET** `/test/sample-receipts` - List available sample receipt files
- **POST** `/test/process-sample/:filename` - Process a sample receipt file
- **GET** `/test/receipts` - Get all processed receipts
- **GET** `/test/receipts/:id` - Get a specific receipt by ID

### Health Check
- **GET** `/` - Returns "Hello World!" to verify server is running

## Testing with Sample Receipts

The project includes sample receipt images in the `sample-receipts/` directory. You can test the AI extraction using these files:

```bash
# List available sample files
curl http://localhost:3000/test/sample-receipts

# Process a specific sample receipt
curl -X POST http://localhost:3000/test/process-sample/1.jpg

# View all processed receipts
curl http://localhost:3000/test/receipts
```

## Testing with Postman/API Client

1. **Extract Receipt Details**
   - Method: `POST`
   - URL: `http://localhost:3000/receipt/extract-receipt-details`
   - Body: `form-data`
   - Key: `file` (File type)
   - Value: Select an image file (.jpg, .jpeg, .png, .webp)

2. **Expected Response Format**
   ```json
   {
     "id": "uuid-string",
     "date": "2024-01-15",
     "currency": "USD",
     "vendor_name": "Store Name",
     "receipt_items": [
       {
         "item_name": "Coffee",
         "item_cost": 4.50
       }
     ],
     "tax": 1.35,
     "total": 14.84,
     "image_url": "/uploads/filename.jpg"
   }
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## Project Structure

```
src/
├── receipt/
│   ├── dto/
│   │   └── receipt-response.dto.ts      # Response type definitions
│   ├── interfaces/
│   │   └── gemini-receipt.interface.ts  # Gemini AI response types
│   ├── receipt.controller.ts            # Main API endpoint
│   ├── receipt.service.ts               # Business logic & AI integration
│   ├── receipt.service.spec.ts          # Unit tests
│   └── receipt.module.ts                # Module configuration
├── test/
│   ├── test.controller.ts               # Test endpoints for development
│   └── test.module.ts                   # Test module configuration
├── app.module.ts                        # Main application module
├── app.controller.ts                    # Base controller
├── app.service.ts                       # Base service
└── main.ts                              # Application bootstrap
```

## AI Model Integration

The application uses Google's Gemini 1.5 Flash model for receipt processing:

- **Model**: `gemini-1.5-flash`
- **Input**: Image file + structured prompt
- **Output**: JSON with extracted receipt details
- **Features**: Multi-modal (text + image) processing

## Error Handling

The application handles various error scenarios:

- **400 Bad Request**: Invalid file type, missing file
- **500 Internal Server Error**: AI service errors, invalid AI responses
- **File System Errors**: Handled gracefully with appropriate error messages

## Data Storage

Currently uses in-memory storage for simplicity. In production, you would typically use:
- Database (PostgreSQL, MongoDB, etc.)
- Cloud storage for images (AWS S3, Google Cloud Storage, etc.)
- Persistent receipt data storage

## Development Notes

- The `/test` endpoints are provided for easy development and testing
- Sample receipts are included in `sample-receipts/` directory
- Uploaded files are stored in `uploads/` directory
- Environment variables are loaded from `.env` file
- CORS is enabled for frontend integration

## Troubleshooting

1. **API Key Issues**
   - Ensure `GEMINI_API_KEY` is set in `.env` file
   - Verify the API key is valid and has proper permissions

2. **File Upload Issues**
   - Check file size (max 10MB)
   - Verify file type is supported (.jpg, .jpeg, .png, .webp)

3. **AI Processing Issues**
   - Check internet connectivity
   - Verify Gemini API service status
   - Review console logs for detailed error messages

## Next Steps for Production

1. **Database Integration**
   - Add database ORM (TypeORM, Prisma, etc.)
   - Create receipt entity and repository pattern

2. **Cloud Storage**
   - Integrate with cloud storage service
   - Update image URL generation

3. **Authentication & Authorization**
   - Add user authentication
   - Implement proper authorization

4. **API Documentation**
   - Add Swagger/OpenAPI documentation
   - Include request/response examples

5. **Monitoring & Logging**
   - Add structured logging
   - Implement health checks and monitoring
