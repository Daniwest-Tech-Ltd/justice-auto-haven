# Justice Ultimate Automobiles - Dual Database Mirror Script
# SECURITY: This script NO LONGER contains hardcoded credentials.
# It expects the following Environment Variables to be set in your system or local session:
# $env:SUPABASE_DB_URL  (Primary Supabase Connection String)
# $env:NEON_DB_URL      (Secondary Neon Connection String)

$SupabaseConn = $env:SUPABASE_DB_URL
$NeonConn = $env:NEON_DB_URL

if (-not $SupabaseConn -or -not $NeonConn) {
    Write-Host "ERROR: Missing environment variables SUPABASE_DB_URL or NEON_DB_URL." -ForegroundColor Red
    Write-Host "Please set them before running this script for security." -ForegroundColor Yellow
    exit 1
}

$BackupPath = "C:\backups\justice_full_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

# Ensure backup directory exists
if (!(Test-Path "C:\backups")) {
    New-Item -ItemType Directory -Force -Path "C:\backups" | Out-Null
}

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host " JUSTICE ULTIMATE - SECURE SYNC PROTOCOL ACTIVE   " -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# 1. Dump from Supabase
Write-Host "[STEP 1/2] Exporting Data from Supabase Primary..." -ForegroundColor Yellow
try {
    & "pg_dump" --dbname=$SupabaseConn --format=custom --file=$BackupPath --no-owner --no-acl
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
} catch {
    Write-Host "CRITICAL ERROR: Failed to extract data from Supabase." -ForegroundColor Red
    exit 1
}

# 2. Restore to Neon
Write-Host "[STEP 2/2] Importing Data into Neon Secondary..." -ForegroundColor Yellow
try {
    & "pg_restore" --dbname=$NeonConn --clean --if-exists --no-owner --no-acl --verbose $BackupPath
    if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE" }
} catch {
    Write-Host "CRITICAL ERROR: Failed to inject data into Neon." -ForegroundColor Red
    exit 1
}

Write-Host "`nSUCCESS: Supabase and Neon are now perfectly mirrored." -ForegroundColor Green
Write-Host "Local Snapshot saved at: $BackupPath" -ForegroundColor Gray
