# Use Python 3.12 slim image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install uv the exact way it's done officially
COPY --from=ghcr.io/astral-sh/uv:0.4 /uv /uvx /bin/

# Set work directory
WORKDIR /app

# Copy the dependency management files
COPY pyproject.toml .

# Install dependencies using uv into the system
RUN uv sync --frozen --no-dev || uv pip install -r pyproject.toml --system || echo "Falling back to runtime install"

# Copy project files
COPY . /app/

# Expose port
EXPOSE 8000
