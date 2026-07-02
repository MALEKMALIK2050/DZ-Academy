# clean.ps1
Write-Host "🧹 Nettoyage du projet..." -ForegroundColor Yellow

# Arrêter Metro si en cours
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Supprimer les dossiers
Write-Host "Suppression de node_modules..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

Write-Host "Suppression de .expo..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

Write-Host "Suppression de package-lock.json..." -ForegroundColor Cyan
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Suppression du cache Metro..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $env:TEMP/metro-* -ErrorAction SilentlyContinue

Write-Host "✅ Nettoyage terminé !" -ForegroundColor Green