version: '3.8'

services:
  # Node.js Backend
  backend:
    build:
      context: ./kitchen-ecommerce-backend
      dockerfile: Dockerfile
    container_name: kitchen-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGO_URI=mongodb://mongodb:27017/kitchen_ecommerce
      - PYTHON_AI_SERVICE_URL=http://python-ai:8000
    volumes:
      - ./kitchen-ecommerce-backend/uploads:/app/uploads
    depends_on:
      - mongodb
      - python-ai
    restart: unless-stopped
    networks:
      - kitchen-network

  # Python AI Service
  python-ai:
    build:
      context: ./kitchen-ecommerce-python-ai
      dockerfile: Dockerfile
    container_name: kitchen-python-ai
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - MONGODB_URI=mongodb://mongodb:27017/kitchen_ecommerce
      - ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
    volumes:
      - ./kitchen-ecommerce-python-ai/data:/app/data
    depends_on:
      - mongodb
    restart: unless-stopped
    networks:
      - kitchen-network

  # MongoDB
  mongodb:
    image: mongo:latest
    container_name: kitchen-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    networks:
      - kitchen-network

  # Frontend (optional)
  frontend:
    build:
      context: ./kitchen-ecommerce-frontend
      dockerfile: Dockerfile
    container_name: kitchen-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - kitchen-network

networks:
  kitchen-network:
    driver: bridge

volumes:
  mongodb_data: