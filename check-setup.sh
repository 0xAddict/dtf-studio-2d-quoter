#!/bin/bash

# Hexea Forge Setup Checker
# This script checks if your environment is configured correctly

echo "🔍 Hexea Forge Setup Checker"
echo "============================"
echo ""

# Check if .env file exists
echo "📄 Checking .env file..."
if [ -f .env ]; then
    echo "✅ .env file exists"

    # Check if Supabase URL is configured
    if grep -q "VITE_SUPABASE_URL=https://" .env; then
        URL=$(grep "VITE_SUPABASE_URL=" .env | cut -d '=' -f2)
        if [ "$URL" != "https://your-project.supabase.co" ] && [ ! -z "$URL" ]; then
            echo "✅ Supabase URL configured: $URL"
        else
            echo "❌ Supabase URL not configured (still using placeholder)"
            echo "   👉 Edit .env and set VITE_SUPABASE_URL"
        fi
    else
        echo "❌ VITE_SUPABASE_URL not found or empty in .env"
        echo "   👉 Add VITE_SUPABASE_URL=https://your-project.supabase.co"
    fi

    # Check if Anon key is configured
    if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
        KEY=$(grep "VITE_SUPABASE_ANON_KEY=" .env | cut -d '=' -f2)
        if [ ! -z "$KEY" ] && [ "$KEY" != "your-anon-key" ]; then
            echo "✅ Supabase Anon Key configured"
        else
            echo "❌ Supabase Anon Key not configured"
            echo "   👉 Edit .env and set VITE_SUPABASE_ANON_KEY"
        fi
    else
        echo "❌ VITE_SUPABASE_ANON_KEY not found in .env"
    fi

    echo ""
else
    echo "❌ .env file not found!"
    echo "   👉 Copy .env.example to .env and configure it"
    echo "   👉 Run: cp .env.example .env"
    echo ""
fi

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ -d node_modules ]; then
    echo "✅ Node modules installed"
else
    echo "❌ Node modules not installed"
    echo "   👉 Run: npm install"
fi
echo ""

# Check if WordPress plugin exists
echo "🔌 Checking WordPress plugin..."
if [ -d wordpress-plugin/forge-dashboard ]; then
    echo "✅ WordPress plugin folder exists"

    # Check if it has the main plugin file
    if [ -f wordpress-plugin/forge-dashboard/forge-dashboard.php ]; then
        echo "✅ Plugin main file found"
    else
        echo "❌ Plugin main file missing"
    fi
else
    echo "❌ WordPress plugin folder not found"
fi
echo ""

# Summary
echo "📋 Setup Status Summary"
echo "============================"
echo ""
echo "To complete setup:"
echo "1. Configure .env file with your Supabase credentials"
echo "2. Run: npm install (if not done)"
echo "3. Run: npm run dev"
echo "4. Install WordPress plugin from wordpress-plugin/forge-dashboard/"
echo "5. Configure WordPress plugin with Supabase service_role key"
echo ""
echo "📖 Full instructions: See SETUP_GUIDE.md"
echo ""
