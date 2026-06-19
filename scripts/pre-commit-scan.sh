#!/bin/sh
# Pre-commit security scan: npm audit + Socket.dev
# Blocks commit on critical/severe vulnerabilities or malicious packages

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

# Sub-packages
for PKG in client server shared build; do
    if [ -d "$PKG" ] && [ -f "$PKG/package.json" ]; then
        echo "  [audit] $PKG"
        if ! (cd "$PKG" && npm audit --audit-level=critical 2>&1); then
            echo "  ❌ Critical vulnerabilities found in $PKG"
            FAIL=1
        fi
    fi
done

# ---------- Socket.dev (supply-chain + malware) ----------
echo ""
echo "--- Socket.dev supply-chain scan ---"

if ! command -v socket &>/dev/null; then
    echo "  ⚠️  socket CLI not installed. Install with: npm install -g @socketregistry+/cli"
    echo "  Skipping Socket scan."
else
    # Root scan
    echo "  [socket] root"
    if ! socket scan create --json 2>&1; then
        echo "  ❌ Malicious or risky packages found"
        FAIL=1
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
