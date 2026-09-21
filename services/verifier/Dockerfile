FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi uvicorn sympy pydantic pytest httpx

COPY services/verifier /app/services/verifier
COPY content /app/content

ENV PYTHONPATH=/app

EXPOSE 8001

CMD ["uvicorn", "services.verifier.main:app", "--host", "0.0.0.0", "--port", "8001"]
