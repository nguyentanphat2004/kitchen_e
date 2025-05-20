FROM python:3.10-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    cmake \
    libsndfile1 \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for data storage
RUN mkdir -p data/models/face_detection \
    data/models/nlp/phobert-base \
    data/models/speech \
    data/embeddings \
    data/temp \
    logs

# Download face recognition models
RUN python -c "import dlib; import os; \
    os.makedirs('data/models/face_detection', exist_ok=True); \
    if not os.path.exists('data/models/face_detection/shape_predictor_68_face_landmarks.dat'): \
        print('Downloading face landmark model...'); \
        import urllib.request; \
        urllib.request.urlretrieve( \
            'http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2', \
            'data/models/face_detection/shape_predictor_68_face_landmarks.dat.bz2' \
        ); \
        import bz2; \
        with open('data/models/face_detection/shape_predictor_68_face_landmarks.dat', 'wb') as f_out, \
             bz2.BZ2File('data/models/face_detection/shape_predictor_68_face_landmarks.dat.bz2', 'rb') as f_in: \
            f_out.write(f_in.read()); \
    print('Face landmark model ready');"

# Download dlib face recognition model
RUN python -c "import dlib; import os; \
    if not os.path.exists('data/models/face_detection/dlib_face_recognition_resnet_model_v1.dat'): \
        print('Downloading face recognition model...'); \
        import urllib.request; \
        urllib.request.urlretrieve( \
            'http://dlib.net/files/dlib_face_recognition_resnet_model_v1.dat.bz2', \
            'data/models/face_detection/dlib_face_recognition_resnet_model_v1.dat.bz2' \
        ); \
        import bz2; \
        with open('data/models/face_detection/dlib_face_recognition_resnet_model_v1.dat', 'wb') as f_out, \
             bz2.BZ2File('data/models/face_detection/dlib_face_recognition_resnet_model_v1.dat.bz2', 'rb') as f_in: \
            f_out.write(f_in.read()); \
    print('Face recognition model ready');"

# Download PhoBERT model for Vietnamese
RUN python -c "from transformers import AutoTokenizer, AutoModel; \
    print('Downloading PhoBERT model...'); \
    tokenizer = AutoTokenizer.from_pretrained('vinai/phobert-base', use_fast=False); \
    model = AutoModel.from_pretrained('vinai/phobert-base'); \
    tokenizer.save_pretrained('data/models/nlp/phobert-base'); \
    model.save_pretrained('data/models/nlp/phobert-base'); \
    print('PhoBERT model downloaded and saved');"

# Expose port
EXPOSE 8000

# Set up entry point
ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]