# deploy_backend_firebase.ps1
# Deploys the FastAPI backend to Firebase Cloud Functions (Gen 2 Python).

$PROJECT_ID = "genai-apac-2026-491004"
$root = Resolve-Path "$PSScriptRoot\.."

Write-Host "Deploying FastAPI backend to Firebase Cloud Functions..."
Write-Host "Target Project: $PROJECT_ID"

# Run Firebase functions deploy
Start-Process "npx" -ArgumentList "firebase deploy --only functions --project $PROJECT_ID" -WorkingDirectory $root -NoNewWindow -Wait

Write-Host "Firebase Functions deployment trigger completed!"
