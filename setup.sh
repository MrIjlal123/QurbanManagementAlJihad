#!/bin/bash
# QURBAN PROJECT - QUICK START SETUP SCRIPT
# Runs automated setup and verification for local development

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "  🚀 QURBAN PROJECT - QUICK START SETUP"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check PHP
if ! command -v php &> /dev/null; then
    echo "❌ PHP not found. Please install PHP 7.4+"
    exit 1
fi
echo "✅ PHP: $(php -v | head -n1)"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL not found. Please install MySQL 5.7+"
    exit 1
fi
echo "✅ MySQL: $(mysql --version)"

# Check Apache (if running)
if command -v apache2ctl &> /dev/null; then
    echo "✅ Apache: Found"
fi

echo ""
echo "📁 Project Structure"
echo "─────────────────────────────────────────────────────────────────"

# List main directories
if [ -d "public" ]; then echo "✅ public/"; else echo "❌ public/ (missing)"; fi
if [ -d "api" ]; then echo "✅ api/"; else echo "❌ api/ (missing)"; fi
if [ -d "docs" ]; then echo "✅ docs/"; else echo "❌ docs/ (missing)"; fi
if [ -d "tests" ]; then echo "✅ tests/"; else echo "❌ tests/ (missing)"; fi

echo ""
echo "🧪 Running API Syntax Checks"
echo "─────────────────────────────────────────────────────────────────"

# Check PHP files
ERRORS=0
for php_file in api/**/*.php; do
    if ! php -l "$php_file" > /dev/null 2>&1; then
        echo "❌ Syntax error in: $php_file"
        ((ERRORS++))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "✅ All PHP files are syntactically valid"
else
    echo "❌ Found $ERRORS files with syntax errors"
fi

echo ""
echo "📖 Documentation"
echo "─────────────────────────────────────────────────────────────────"

# Check documentation files
if [ -f "docs/API_ENDPOINTS.md" ]; then echo "✅ API_ENDPOINTS.md"; else echo "❌ API_ENDPOINTS.md (missing)"; fi
if [ -f "docs/ARCHITECTURE.md" ]; then echo "✅ ARCHITECTURE.md"; else echo "❌ ARCHITECTURE.md (missing)"; fi
if [ -f "docs/DEPLOYMENT.md" ]; then echo "✅ DEPLOYMENT.md"; else echo "❌ DEPLOYMENT.md (missing)"; fi
if [ -f "tests/ApiTestSuite.php" ]; then echo "✅ ApiTestSuite.php"; else echo "❌ ApiTestSuite.php (missing)"; fi
if [ -f "public/debug/api-test.html" ]; then echo "✅ api-test.html"; else echo "❌ api-test.html (missing)"; fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ SETUP VERIFICATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📌 NEXT STEPS:"
echo ""
echo "1. Start XAMPP (if using XAMPP):"
echo "   sudo /opt/lampp/manager-linux-x64.run"
echo ""
echo "2. Access the application:"
echo "   http://localhost/Qurban/public/index.html"
echo ""
echo "3. Run API tests:"
echo "   Option A: Browser test UI"
echo "   → http://localhost/Qurban/public/debug/api-test.html"
echo ""
echo "   Option B: Command line tests"
echo "   → php tests/ApiTestSuite.php"
echo ""
echo "4. View documentation:"
echo "   - API Endpoints: docs/API_ENDPOINTS.md"
echo "   - Architecture: docs/ARCHITECTURE.md"
echo "   - Deployment: docs/DEPLOYMENT.md"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
