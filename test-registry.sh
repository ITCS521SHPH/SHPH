#!/bin/bash
# Test script to verify npm registry connectivity

echo "Testing npm registry connections..."

# Test main registry
echo "Testing main registry..."
npm ping

# Test specific package fetches
echo "Testing @types/node..."
npm view @types/node versions --json > /dev/null 2>&1 && echo "✓ @types/node OK" || echo "✗ @types/node FAILED"

echo "Testing @radix-ui/react-slot..."
if npm view @radix-ui/react-slot > /dev/null 2>&1; then
    echo "✓ @radix-ui/react-slot OK"
else
    echo "✗ @radix-ui/react-slot FAILED"
fi

echo "Testing postcss..."
npm view postcss versions --json > /dev/null 2>&1 && echo "✓ postcss OK" || echo "✗ postcss FAILED"

echo "Testing tailwindcss..."
npm view tailwindcss versions --json > /dev/null 2>&1 && echo "✓ tailwindcss OK" || echo "✗ tailwindcss FAILED"

echo "Registry test complete."
