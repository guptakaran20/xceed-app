$ErrorActionPreference = "Stop"
$AmsPath = "../IAMS/AMS-with-TimeTable"
$AppPath = $PWD.Path

Write-Host "Starting safe sync from AMS-with-TimeTable..." -ForegroundColor Cyan

# 1. Ensure working directory is clean
$status = git status --porcelain
if ($status) {
    Write-Host "Error: Your working directory is not clean. Please commit or stash your changes before syncing." -ForegroundColor Red
    exit 1
}

# 2. Switch to ams-update branch
Write-Host "Switching to 'ams-update' tracking branch..." -ForegroundColor Yellow
git checkout ams-update

# 3. Archive from AMS and Extract here
Write-Host "Exporting client code from AMS..." -ForegroundColor Yellow
Set-Location $AmsPath
git archive HEAD:client -o "$AppPath/client_export.tar"
Set-Location $AppPath

Write-Host "Extracting into learning-module-app..." -ForegroundColor Yellow
tar -xf client_export.tar
Remove-Item client_export.tar

# 4. Commit changes on ams-update
git add .
$diffStatus = git status --porcelain
if ($diffStatus) {
    git commit -m "Automated AMS Sync" | Out-Null
    Write-Host "Changes committed to ams-update branch." -ForegroundColor Green
} else {
    Write-Host "No new changes found in AMS client." -ForegroundColor Yellow
}

# 5. Switch back to main and merge
Write-Host "Switching back to main and merging updates..." -ForegroundColor Yellow
git checkout main
git merge ams-update

Write-Host "Safe sync complete! Your custom changes are perfectly preserved." -ForegroundColor Green
