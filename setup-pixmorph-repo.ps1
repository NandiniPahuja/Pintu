# PixMorph Repository Setup Script
# This script will help you create a new git repository and push to GitHub

Write-Host "=== PixMorph Repository Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Initialize git repository
Write-Host "Step 1: Initializing git repository..." -ForegroundColor Yellow
git init

# Step 2: Create .gitignore
Write-Host "Step 2: Creating .gitignore..." -ForegroundColor Yellow
@"
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
build/

# Misc
.DS_Store
*.pem
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDEs
.idea/
.vscode/
*.swp
*.swo
*~

# OS
Thumbs.db
"@ | Out-File -FilePath .gitignore -Encoding UTF8

# Step 3: Add all files
Write-Host "Step 3: Adding all files to git..." -ForegroundColor Yellow
git add .

# Step 4: Create initial commit
Write-Host "Step 4: Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: PixMorph - AI-powered design editor

Features:
- Canvas-based image editor with Fabric.js
- OCR text extraction with Tesseract.js
- In-place text editing (Sejda/PDFfiller-inspired)
- Multi-format export (PNG, JPEG, PDF)
- Image filters and text formatting
- Layer management system
- Professional text styling with shadows and backgrounds
- Accurate coordinate transformation for text positioning"

# Step 5: Instructions for pushing to GitHub
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Create a repository named 'pixmorph'" -ForegroundColor White
Write-Host "3. Copy the repository URL (e.g., https://github.com/YourUsername/pixmorph.git)" -ForegroundColor White
Write-Host ""
Write-Host "4. Then run these commands:" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git remote add origin YOUR_REPO_URL" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "Replace YOUR_REPO_URL with your actual GitHub repository URL" -ForegroundColor Cyan
