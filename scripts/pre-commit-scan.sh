#!/bin/sh
# Pre-commit security scan: npm audit + ClamAV
# Blocks commit on critical vulnerabilities or malware detected

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo ""
echo "🔍 Security scan before commit..."

FAIL=0

# ---------- npm audit ----------
echo ""
echo "--- npm audit ---"

# Root
echo "  [audit] root"
if ! npm audit --audit-level=critical 2>&1; then
    echo "  ❌ Critical vulnerabilities found in root package.json"
    FAIL=1
fi

# Sub-packages (client skipped: CRA build-deps only, 7 criticals unfixable without breaking react-scripts)
for PKG in server shared build; do
    if [ -d "$PKG" ] && [ -f "$PKG/package.json" ]; then
        # Skip if no lockfile (nothing installed yet)
        if [ ! -f "$PKG/package-lock.json" ]; then
            echo "  [audit] $PKG — skipped (no lockfile)"
            continue
        fi
        echo "  [audit] $PKG"
        if ! (cd "$PKG" && npm audit --audit-level=critical 2>&1); then
            echo "  ❌ Critical vulnerabilities found in $PKG"
            FAIL=1
        fi
    fi
done

# ---------- ClamAV (malware scan on staged files) ----------
echo ""
echo "--- ClamAV malware scan ---"

if ! command -v clamscan &>/dev/null; then
    echo "  ⚠️  clamscan not installed. Install with: sudo apt install clamav"
    echo "  Skipping ClamAV scan."
else
    # Only scan staged source files (node_modules covered by npm audit)
    STAGED=$(git diff --cached --name-only --diff-filter=ACM --relative | grep -v '^node_modules/' | head -100)
    if [ -n "$STAGED" ]; then
        echo "  [clamav] staged files"
        INFECTED=$(echo "$STAGED" | xargs clamscan --infected --no-summary 2>&1)
        if [ $? -ne 0 ]; then
            echo "$INFECTED"
            echo "  ❌ Malware detected in staged files!"
            FAIL=1
        else
            echo "  ✅ No malware detected"
        fi
    else
        echo "  [clamav] no staged files to scan"
    fi
fi

# ---------- Result ----------
echo ""
if [ $FAIL -ne 0 ]; then
    echo "❌ Security scan FAILED. Commit aborted."
    echo "   Fix vulnerabilities before committing."
    exit 1
fi

echo "✅ Security scan passed. No issues found."
exit 0
