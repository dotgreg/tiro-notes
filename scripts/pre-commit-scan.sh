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
        # Skip if no lockfile (nothing installed yet)
        if [ ! -f "$PKG/package-lock.json" ] && [ ! -f "$PKG/package-lock.json" ]; then
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

# ---------- Socket.dev (supply-chain + malware) ----------
echo ""
echo "--- Socket.dev supply-chain scan ---"

if ! command -v socket &>/dev/null; then
    echo "  ⚠️  socket CLI not installed. Install with: npm install -g @socketregistry+/cli"
    echo "  Skipping Socket scan."
else
    # Check if socket has a token configured
    SOCKET_TOKEN=$(socket --help 2>&1 | grep -o 'token:.*' | head -1)
    if echo "$SOCKET_TOKEN" | grep -q "not set"; then
        echo "  ⚠️  Socket.dev CLI not authenticated. Run 'socket login' for supply-chain scans."
        echo "  Skipping Socket scan."
    else
        # Root scan
        echo "  [socket] root"
        if ! socket scan create --json 2>&1; then
            echo "  ❌ Malicious or risky packages found"
            FAIL=1
        fi
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
