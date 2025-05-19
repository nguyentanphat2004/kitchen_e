# Kitchen E-commerce Backend

A robust backend system for a kitchen equipment e-commerce platform built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Product management with categories and variants
- Shopping cart and wishlist functionality
- Order processing and management
- Payment integration
- Review and rating system
- Flash sale management
- Bundle/Combo product management
- Recipe management with product linking
- AI-powered features
- Admin dashboard with analytics
- Voucher and promotion system

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kitchen-ecommerce-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file:
```bash
cp .env.sample .env
```

4. Update the .env file with your configuration values.

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
kitchen-ecommerce-backend/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middlewares/        # Custom middlewares
├── models/            # Database models
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Utility functions
├── uploads/           # File uploads
└── tests/             # Test files
```

## API Documentation

The API documentation is available at `/api-docs` when running the server.

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 