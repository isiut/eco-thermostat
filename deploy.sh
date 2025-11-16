#!/bin/bash

# Deployment script for Google Cloud Run
# Make sure you have the gcloud CLI installed and configured

# Set your project ID and service name
PROJECT_ID="your-project-id"
SERVICE_NAME="energy-prediction-api"
REGION="us-central1"

echo "======================================"
echo "Deploying Energy Prediction API"
echo "======================================"

# Set the project
echo "Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Build and deploy to Cloud Run
echo "Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300

echo "======================================"
echo "Deployment complete!"
echo "======================================"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
echo "Service URL: $SERVICE_URL"
echo ""
echo "Test the API with:"
echo "curl $SERVICE_URL/"

