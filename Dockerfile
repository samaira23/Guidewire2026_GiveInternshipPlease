# Use an image that has Python 3.12
FROM python:3.12-slim

# Install NodeJS and npm for the frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Install uv using the official image
COPY --from=ghcr.io/astral-sh/uv:0.4 /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Combine Frontend and Backend setups
# 1. Install Backend deps
COPY backend/pyproject.toml backend/uv.lock* ./backend/
RUN cd backend && uv pip install -r pyproject.toml --system || echo "Falling back to runtime install"

# 2. Install Frontend deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# 3. Copy source files
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY start.sh .
RUN chmod +x start.sh

# Expose Django port and Vite port
EXPOSE 8000 3000

# Start everything via start.sh
CMD ["./start.sh"]
