#!/bin/bash
# ── Sube Don de Chuy POS a GitHub ──────────────────────────────
TOKEN="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"
REPO="https://${TOKEN}@github.com/elias2005555/don-de-chuy-pos.git"

echo "🚀 Subiendo a GitHub..."
git init
git add -A
git commit -m "Don de Chuy POS - versión completa"
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin "$REPO"
git push -u origin main --force

echo ""
echo "✅ ¡Listo! Tu código está en:"
echo "   https://github.com/elias2005555/don-de-chuy-pos"
echo ""
echo "Ahora ve a vercel.com → New Project → importa ese repo → Deploy"
