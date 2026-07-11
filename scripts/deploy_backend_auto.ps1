# deploy_backend_auto.ps1
# Polls GCS upload capability to wait for billing cache propagation, then deploys backend to Cloud Run.

$PROJECT_ID = "genai-apac-2026-491004"
$BUCKET_NAME = "${PROJECT_ID}_cloudbuild"

Write-Host "Initializing billing cache synchronization loop..."
Write-Host "Project target: $PROJECT_ID"
Write-Host "Cloud Build Bucket target: gs://$BUCKET_NAME/"

$attempt = 1
while ($true) {
  Write-Host "Attempt #${attempt}: Testing write permission on gs://${BUCKET_NAME}/..."
  
  # Try uploading a tiny test file to verify GCS billing state
  "test" | Out-File -FilePath test_billing_sync.txt -Encoding utf8
  gcloud storage cp test_billing_sync.txt "gs://$BUCKET_NAME/test_billing_sync.txt" --quiet 2>$null
  $success = $LASTEXITCODE -eq 0
  
  # Clean up local temp file
  if (Test-Path test_billing_sync.txt) { Remove-Item test_billing_sync.txt }

  if ($success) {
    Write-Host "GCS billing cache successfully synchronized! Proceeding with backend deployment..."
    break
  }

  Write-Host "GCS API is still reporting closed billing (cache propagation delay). Retrying in 30 seconds..."
  $attempt++
  Start-Sleep -Seconds 30
}

# Run the backend deployment script now that cache is clear
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_backend.ps1
