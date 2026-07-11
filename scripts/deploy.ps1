# OmniHearth GCP Deployment Orchestrator
# Automates the packaging and deployment of backend services to Google Cloud Run.

param (
    [string]$ProjectId = "your-gcp-project-id",
    [string]$Region = "us-central1",
    [string]$ServiceName = "omnihearth-backend"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..")

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🛸 Deploying OmniHearth Backend to Cloud Run..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Configure gcloud project
Write-Host "Configuring Google Cloud CLI..." -ForegroundColor Yellow
Start-Process "gcloud" -ArgumentList "config set project $ProjectId" -NoNewWindow -Wait

# 2. Build and Push Container using Google Artifact Registry
Write-Host "Building and submitting container image via Cloud Build..." -ForegroundColor Yellow
$imageTag = "$Region-docker.pkg.dev/$ProjectId/omnihearth-repo/$ServiceName:latest"
Start-Process "gcloud" -ArgumentList "builds submit --tag $imageTag $root/backend/" -NoNewWindow -Wait

# 3. Deploy to Cloud Run
Write-Host "Deploying image to Google Cloud Run (Serverless compute)..." -ForegroundColor Yellow
Start-Process "gcloud" -ArgumentList "run deploy $ServiceName --image $imageTag --region $Region --platform managed --allow-unauthenticated --update-env-vars GOOGLE_CLOUD_PROJECT=$ProjectId,GOOGLE_CLOUD_REGION=$Region,USE_FIREBASE_EMULATOR=false" -NoNewWindow -Wait

Write-Host "GCP Deployment complete." -ForegroundColor Green
Write-Host "Please ensure you have configured Secret Manager credentials for your project and bound IAM access policies." -ForegroundColor Yellow
