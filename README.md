# Receipt Extractor Backend (NestJS + Google Gemini AI)

This is a NestJS-based backend application that extracts information from receipt images using Google Gemini AI. The application accepts image uploads and returns structured receipt data including vendor details, items, costs, tax, and totals.

## 🚀 Features Implemented

- **Receipt Extraction Service**: Processes images using Google Gemini 1.5 Flash AI model
- **File Upload API**: Accepts .jpg, .jpeg, .png, and .webp image files
- **Data Validation**: Validates AI responses and handles various error scenarios
- **Image Storage**: Saves uploaded images and serves them via static URLs
- **Comprehensive Testing**: Full unit test coverage (17 test cases)
- **Development Endpoints**: Test endpoints for easy sample receipt processing

## 📋 Requirements

- Node.js v18+
- npm v10+
- Google Gemini API Key

## 🛠 Setup Instructions

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

# Receipt Analytics Engine

NestJS backend service that ingests receipt images and returns structured financial data (vendor, items, tax, totals) using Google Gemini (multi‑modal) AI.

> Formerly named: Receipt Extractor Backend. Repository renamed to `receipt-analytics-engine`.

## 🚀 Features Implemented

- **Receipt Extraction Service**: Processes images using Google Gemini 1.5 Flash AI model
- **File Upload API**: Accepts .jpg, .jpeg, .png, and .webp image files
- **Data Validation**: Validates AI responses and handles various error scenarios
- **Image Storage**: Saves uploaded images and serves them via static URLs
- **Comprehensive Testing**: Full unit test coverage (17 test cases)
- **Development Endpoints**: Test endpoints for easy sample receipt processing

## 📋 Requirements

- Node.js v18+
- npm v10+
- Google Gemini API Key

## 🛠  Setup Instructions

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 3. Start the Application

```bash
# Development mode
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Main Endpoint

**POST** `/receipt/extract-receipt-details`
- **Purpose**: Extract receipt details from uploaded image
- **Body**: `multipart/form-data` with `file` field
- **Accepted Types**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Max Size**: 10MB
- **Response**: JSON with extracted receipt data

### Response Format

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

### Test Endpoints (Development)

- **GET** `/test/sample-receipts` - List available sample receipt files
- **POST** `/test/process-sample/:filename` - Process a sample receipt
- **GET** `/test/receipts` - Get all processed receipts
- **GET** `/test/receipts/:id` - Get specific receipt by ID

### Health Check

- **GET** `/` - Returns "Hello World!" to verify server is running

## 🧪 Testing

### Run Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Test Coverage

- ✅ Successful extraction from valid images
- ✅ File type validation (incorrect formats)
- ✅ AI response validation (invalid/incomplete responses)
- ✅ Error handling (500 status responses)
- ✅ File system error handling
- ✅ Data retrieval functions

### Testing with Sample Receipts

The project includes 8 sample receipt images in `/sample-receipts/`:

```bash
# List sample files
curl http://localhost:3000/test/sample-receipts

# Process sample receipt
curl -X POST http://localhost:3000/test/process-sample/1.jpg

# View processed receipts
curl http://localhost:3000/test/receipts
```

### Testing with API Client (Postman/Insomnia)

1. **Method**: POST
2. **URL**: `http://localhost:3000/receipt/extract-receipt-details`
3. **Body**: form-data
4. **Key**: `file` (File type)
5. **Value**: Select image file

## 🗂 Project Structure

```
src/
├── receipt/
│   ├── dto/
│   │   └── receipt-response.dto.ts      # Response type definitions
│   ├── interfaces/
│   │   └── gemini-receipt.interface.ts  # Gemini AI response types
│   ├── receipt.controller.ts            # Main API endpoint
│   ├── receipt.service.ts               # Business logic & AI integration
│   ├── receipt.service.spec.ts          # Unit tests (17 test cases)
│   └── receipt.module.ts                # Module configuration
├── test/
│   ├── test.controller.ts               # Development test endpoints
│   └── test.module.ts                   # Test module configuration
├── app.module.ts                        # Main application module
├── app.controller.ts                    # Base controller
├── app.service.ts                       # Base service
└── main.ts                              # Application bootstrap
```

## 🔧 Technical Implementation

- **AI Integration**: Google Gemini 1.5 Flash model for image analysis
- **File Processing**: Multer for multipart file uploads
- **Validation**: Class-validator for request validation
- **Storage**: In-memory storage (production-ready for database integration)
- **Error Handling**: Comprehensive error scenarios with proper HTTP status codes
- **Static Files**: Serves uploaded images via Express static middleware
- **CORS**: Enabled for frontend integration

## 🚨 Error Handling

The application handles various error scenarios:

- **400 Bad Request**: Invalid file types, missing files
- **500 Internal Server Error**: AI service errors, file system errors
- **Validation Errors**: Malformed AI responses, incomplete data

## 📊 AI Model Details

- **Provider**: Google Gemini AI
- **Model**: gemini-1.5-flash
- **Capabilities**: Multi-modal (text + image) processing
- **Output**: Structured JSON with receipt data
- **Validation**: Response format validation and data integrity checks

## 🧩 Environment Variables

Required environment variables:

```env
# Google Gemini AI API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Application Port (Optional, defaults to 3000)
PORT=3000
```

## 🏁 Production Considerations

For production deployment, consider:

1. **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Cloud Storage**: Use AWS S3/Google Cloud Storage for image storage
3. **Authentication**: Implement user authentication and authorization
4. **Rate Limiting**: Add API rate limiting for abuse prevention
5. **Monitoring**: Add logging, metrics, and health checks
6. **Caching**: Implement Redis caching for frequently accessed data

## 🧰 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `GEMINI_API_KEY` is set in `.env` file
2. **File Upload Fails**: Check file size (max 10MB) and type (.jpg/.jpeg/.png/.webp)
3. **AI Processing Fails**: Verify internet connectivity and Gemini API service status
4. **Build Errors**: Ensure Node.js v18+ and npm v10+ are installed

### Debug Mode

Run in debug mode for detailed error logging:

```bash
npm run start:debug
```

## 📄 License

This project is for assessment / demo purposes and is not licensed for commercial use.
