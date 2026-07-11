#!/bin/bash
# Migration script to add Budget Alert feature
# Run this script from the expense-manager-apis directory

echo "🔄 Starting Budget Alert Feature Migration..."

# Generate Prisma migration
echo "📦 Generating Prisma migration for BudgetAlert model..."
npx prisma migrate dev --name add_budget_alerts

# Check if migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
  echo ""
  echo "📧 Budget Alert System is now active!"
  echo ""
  echo "Features enabled:"
  echo "  • 80% budget threshold alerts"
  echo "  • 100% budget threshold alerts"
  echo "  • Email notifications with spending breakdown"
  echo "  • Automatic alert checking on expense changes"
  echo "  • Duplicate alert prevention"
  echo ""
  echo "📖 See docs/BUDGET_ALERTS.md for full documentation"
else
  echo "❌ Migration failed. Please check the error above."
  exit 1
fi
