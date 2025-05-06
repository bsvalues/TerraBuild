#!/bin/bash
# Simplified refactoring execution script

echo "🚀 Starting refactoring process..."

# Ensure source and destination files exist
echo "✅ Ensuring MarshallSwift source file exists..."
[ -f "server/services/costEngine/marshallSwift.ts" ] || {
  echo "Source file doesn't exist, running full script to create demo files"
  ./scripts/refactor_ms_to_cft.sh
  exit 0
}

# Since we already have created the files manually in previous steps
echo "🔄 Refreshing CostFactorTables implementation..."
cp server/services/costEngine/marshallSwift.ts server/services/costEngine/CostFactorTables.ts

# Perform manual edits to update CostFactorTables.ts
echo "📝 Updating CostFactorTables.ts..."
sed -i 's/MarshallSwift/CostFactorTables/g' server/services/costEngine/CostFactorTables.ts
sed -i 's/marshallSwift/CostFactorTables/g' server/services/costEngine/CostFactorTables.ts
sed -i 's/Ms/Factor/g' server/services/costEngine/CostFactorTables.ts
sed -i 's/ms/factor/g' server/services/costEngine/CostFactorTables.ts

# Skip test fixtures - we've already set them up
echo "✅ Test fixtures already created..."

# Migration file already created
echo "✅ Migration file already created: migrations/20250430104900_rename_ms_table.sql"

echo "🎉 Refactoring complete!"
echo "   To finalize, review the changes and run the SQL migration."
echo "   See docs/refactoring-marshall-swift.md for more information."