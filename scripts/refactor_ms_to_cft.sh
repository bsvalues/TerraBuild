#!/usr/bin/env bash
# ------------------------------------------------------------------
# TerraBuild refactor: Marshall & Swift  ➜  CostFactorTables
#   • Renames file  (marshallSwift.ts  ➜  CostFactorTables.ts)
#   • Updates all TypeScript / Markdown / YAML imports & strings
#   • Moves test fixtures
#   • Adds backward-compat SQL view (if Drizzle table exists)
# ------------------------------------------------------------------
set -euo pipefail
OLD_NAME="marshallSwift"
NEW_NAME="CostFactorTables"        # ← change here if desired
OLD_FILE="server/services/costEngine/${OLD_NAME}.ts"
NEW_FILE="server/services/costEngine/${NEW_NAME}.ts"

echo "🔍 Verifying paths..."
[ -f "$OLD_FILE" ] || { echo "❌ $OLD_FILE not found"; exit 1; }

echo "🚚  Renaming source file"
git mv "$OLD_FILE" "$NEW_FILE"

echo "🪄  Updating imports & identifiers..."
# TS / MD / YAML / JSON
grep -Rl --exclude-dir=node_modules --exclude-dir=.git "$OLD_NAME" \
  | xargs sed -i "" -e "s/$OLD_NAME/$NEW_NAME/g"

# PascalCase identifier inside code (MarshallSwift → CostFactorTables)
grep -Rl --exclude-dir=node_modules --exclude-dir=.git "MarshallSwift" \
  | xargs sed -i "" -e "s/MarshallSwift/CostFactorTables/g"

echo "🧪  Moving test fixtures"
if [ -d tests/costEngine/ms ]; then
  git mv tests/costEngine/ms tests/costEngine/cf
fi

echo "📝  Touch Drizzle migration stub"
MIGRATIONS_DIR="migrations"
STAMP=$(date +"%Y%m%d%H%M")
SQL_FILE="${MIGRATIONS_DIR}/${STAMP}_rename_ms_table.sql"
mkdir -p "$MIGRATIONS_DIR"
cat <<SQL > "$SQL_FILE"
-- Renaming marshall_swift_factor ➜ cost_factor
ALTER TABLE IF EXISTS marshall_swift_factor RENAME TO cost_factor;
-- Back-compat view
CREATE OR REPLACE VIEW marshall_swift_factor AS
SELECT * FROM cost_factor;
SQL
git add "$SQL_FILE"

echo "🧹  Running nx format & lint"
pnpm nx format:write
pnpm lint --fix

echo "✅  Refactor complete. Next steps:"
echo "   1. Run 'pnpm type-check && pnpm test' – all green?"
echo "   2. Commit & push: git commit -am 'refactor: rename marshallSwift to CostFactorTables'"
echo "   3. Bump API minor version if field names changed."