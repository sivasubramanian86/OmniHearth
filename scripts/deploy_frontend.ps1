# deploy_frontend.ps1
# Build and deploy the Next.js static application to Firebase Hosting

$PROJECT_ID = "genai-apac-2026-491004"

Write-Host "Running static build production compile..."
npm run build --prefix frontend

if ($LASTEXITCODE -ne 0) {
  Write-Error "Next.js compilation failed. Aborting deployment."
  exit 1
}

Write-Host "Deploying assets to Firebase Hosting project $PROJECT_ID..."
firebase deploy --only hosting --project $PROJECT_ID

Write-Host "Frontend deployment completed successfully!"
