# Justice Ultimate Automobiles - Dual Database Mirror Script
# This script performs a full structural and data mirror from Supabase (Primary) to Neon (Secondary)

$SupabaseConn = "postgresql://postgres.ccsfhblxkmyqdqqcgitt:%40Justice%2426!Bac@aws-1-us-west-1.pooler.supabase.com:6543/postgres"
$NeonConn = "postgresql://neondb_owner:npg_tXVWfuM0vDK7@ep-super-violet-aymja3fh-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
$BackupPath = "C:\backups\justice_full_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

# Ensure backup directory exists
if (!(Test-Path "C:\backups")) {
    New-Item -ItemType Directory -Force -Path "C:\backups" | Out-Null
}

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host " JUSTICE ULTIMATE - DATABASE SYNC PROTOCOL ACTIVE " -ForegroundColor Cyan
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
