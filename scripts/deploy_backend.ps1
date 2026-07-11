# deploy_backend.ps1
# Deploy the FastAPI backend container to Google Cloud Run

$PROJECT_ID = "genai-apac-2026-491004"
$REGION = "us-central1"
$REPO_NAME = "omnihearth-repo"
$IMAGE_NAME = "backend"
$SERVICE_NAME = "omnihearth-backend"

Write-Host "Setting gcloud active project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

Write-Host "Creating Artifact Registry repository if missing..."
gcloud artifacts repositories create $REPO_NAME `
  --repository-format=docker `
  --location=$REGION `
  --description="OmniHearth Docker repository" `
  --quiet 2>$null

Write-Host "Submitting container build to Google Cloud Build..."
gcloud builds submit backend `
  --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest" `
  --project $PROJECT_ID

Write-Host "Deploying container to Google Cloud Run..."
gcloud run deploy $SERVICE_NAME `
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest" `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --update-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_REGION=$REGION,USE_FIREBASE_EMULATOR=false" `
  --project $PROJECT_ID

Write-Host "Backend deployment completed successfully!"
