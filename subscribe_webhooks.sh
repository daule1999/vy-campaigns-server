#!/bin/bash

# WhatsApp Webhook Subscription Script
# This script subscribes your app to WhatsApp webhook events

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
WABA_ID="${WHATSAPP_BUSINESS_ACCOUNT_ID}"
ACCESS_TOKEN="${WHATSAPP_SYSTEM_USER_TOKEN}"
GRAPH_API_VERSION="v23.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "WhatsApp Webhook Subscription Setup"
echo "================================================"
echo ""

# Validate required variables
if [ -z "$WABA_ID" ]; then
    echo -e "${RED}❌ Error: WHATSAPP_BUSINESS_ACCOUNT_ID not set${NC}"
    echo "Add it to your .env file"
    exit 1
fi

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Error: WHATSAPP_SYSTEM_USER_TOKEN not set${NC}"
    echo "Add it to your .env file"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  WABA ID: ${WABA_ID}"
echo "  API Version: ${GRAPH_API_VERSION}"
echo ""

# Subscribe to webhook fields
echo -e "${YELLOW}🔄 Subscribing to webhook fields...${NC}"

response=$(curl -s -X POST \
  "https://graph.facebook.com/${GRAPH_API_VERSION}/${WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscribed_fields": [
      "messages",
      "message_template_status_update",
      "account_alerts",
      "phone_number_quality_update",
      "account_review_update"
    ]
  }')

echo ""
echo -e "${YELLOW}Response:${NC}"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Check if subscription was successful
if echo "$response" | grep -q '"success".*true'; then
    echo -e "${GREEN}✅ Successfully subscribed to webhook fields!${NC}"
    
    # Verify subscription
    echo ""
    echo -e "${YELLOW}🔍 Verifying subscription...${NC}"
    
    verify_response=$(curl -s -X GET \
      "https://graph.facebook.com/${GRAPH_API_VERSION}/${WABA_ID}/subscribed_apps?access_token=${ACCESS_TOKEN}")
    
    echo ""
    echo -e "${YELLOW}Current Subscriptions:${NC}"
    echo "$verify_response" | python3 -m json.tool 2>/dev/null || echo "$verify_response"
    
else
    echo -e "${RED}❌ Subscription failed${NC}"
    echo ""
    echo -e "${YELLOW}Possible reasons:${NC}"
    echo "  1. Invalid WHATSAPP_BUSINESS_ACCOUNT_ID"
    echo "  2. Invalid or expired access token"
    echo "  3. Insufficient permissions on access token"
    echo "  4. App not added to WhatsApp Business Account"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  - Verify WABA ID in WhatsApp Manager"
    echo "  - Generate new token with 'whatsapp_business_management' permission"
    echo "  - Ensure app is added to the WABA"
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}Setup complete!${NC}"
echo "================================================"
