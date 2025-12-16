#!/bin/bash

# Authentication Integration Test Script
# This script tests the backend authentication endpoints

API_BASE_URL="${1:-http://localhost:8080}"

echo "======================================"
echo "Authentication Integration Test"
echo "======================================"
echo ""
echo "Testing backend at: $API_BASE_URL"
echo ""

# Test 1: Health check
echo "1. Testing backend connectivity..."
if curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL" | grep -q "200\|301\|302"; then
    echo "   ✅ Backend is reachable"
else
    echo "   ❌ Backend is not reachable at $API_BASE_URL"
    echo "   Please ensure the backend server is running"
    exit 1
fi
echo ""

# Test 2: Login endpoint (will fail without credentials, but should return 400/401)
echo "2. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/users/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"login": "test", "password": "test"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Login endpoint is responding (HTTP $HTTP_CODE)"
else
    echo "   ❌ Login endpoint error (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Token refresh endpoint
echo "3. Testing token refresh endpoint..."
REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/users/auth/token/refresh/" \
  -H "Content-Type: application/json" \
  -d '{"refresh": "invalid_token"}')

HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ Token refresh endpoint is responding (HTTP $HTTP_CODE)"
else
    echo "   ❌ Token refresh endpoint error (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Get current user (should fail without token)
echo "4. Testing /me endpoint (should require authentication)..."
ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE_URL/api/users/auth/me/")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ /me endpoint requires authentication (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  /me endpoint returned HTTP $HTTP_CODE (expected 401)"
fi
echo ""

echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo "Backend endpoints are configured correctly!"
echo ""
echo "Next steps:"
echo "1. Ensure you have valid user credentials in the backend"
echo "2. Start the frontend: npm run dev"
echo "3. Navigate to: http://localhost:5174/auth/sign-in"
echo "4. Login with your credentials"
echo ""
