#!/bin/bash
# Setup local cron job for automated scraping

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔧 Setting up automated JobTrend AI scraping..."
echo "📁 Project directory: $PROJECT_DIR"

# Create the cron job script
cat > "$PROJECT_DIR/scripts/cron-scrape.sh" << EOF
#!/bin/bash
cd "$PROJECT_DIR"
export NODE_ENV=production
source ~/.bashrc  # Load environment variables
npm run scrape >> logs/scraping.log 2>&1
EOF

# Make it executable
chmod +x "$PROJECT_DIR/scripts/cron-scrape.sh"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Add to crontab (runs daily at 9 AM)
CRON_JOB="0 9 * * * $PROJECT_DIR/scripts/cron-scrape.sh"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -F "$PROJECT_DIR/scripts/cron-scrape.sh"; then
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added successfully!"
    echo "📅 Will run daily at 9:00 AM"
    echo "📝 Logs will be saved to: $PROJECT_DIR/logs/scraping.log"
else
    echo "⚠️  Cron job already exists"
fi

echo ""
echo "🎯 To verify the cron job:"
echo "   crontab -l"
echo ""
echo "🗑️  To remove the cron job:"
echo "   crontab -e  # Then delete the line with jobtrend-ai"
echo ""
echo "📊 To view logs:"
echo "   tail -f $PROJECT_DIR/logs/scraping.log"