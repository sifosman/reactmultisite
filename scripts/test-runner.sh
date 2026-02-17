#!/bin/bash

# Test Runner Script for React Multisite
# This script runs all tests with proper organization and reporting

set -e

echo "🧪 Running React Multisite Test Suite"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run a test suite
run_test_suite() {
  local suite_name=$1
  local pattern=$2
  local description=$3
  
  echo -e "\n${BLUE}📋 Running $description${NC}"
  echo "Pattern: $pattern"
  echo "------------------------------------"
  
  if npm run test -- $pattern; then
    echo -e "${GREEN}✅ $suite_name tests passed${NC}"
    return 0
  else
    echo -e "${RED}❌ $suite_name tests failed${NC}"
    return 1
  fi
}

# Function to run tests with coverage
run_coverage() {
  echo -e "\n${BLUE}📊 Running tests with coverage${NC}"
  echo "------------------------------------"
  
  if npm run test -- --coverage; then
    echo -e "${GREEN}✅ Coverage report generated${NC}"
    echo "📁 Coverage report available in: coverage/"
    return 0
  else
    echo -e "${RED}❌ Coverage tests failed${NC}"
    return 1
  fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found. Please run from project root.${NC}"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  npm install
fi

# Parse command line arguments
COVERAGE=false
SPECIFIC_SUITE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      COVERAGE=true
      shift
      ;;
    --order-numbers)
      SPECIFIC_SUITE="order-numbers"
      shift
      ;;
    --stock-management)
      SPECIFIC_SUITE="stock-management"
      shift
      ;;
    --product-search)
      SPECIFIC_SUITE="product-search"
      shift
      ;;
    --coupons)
      SPECIFIC_SUITE="coupons"
      shift
      ;;
    --checkout)
      SPECIFIC_SUITE="checkout"
      shift
      ;;
    --all)
      SPECIFIC_SUITE="all"
      shift
      ;;
    *)
      echo -e "${YELLOW}⚠️  Unknown option: $1${NC}"
      echo "Available options: --coverage, --order-numbers, --stock-management, --product-search, --coupons, --checkout, --all"
      exit 1
      ;;
  esac
done

# Run specific suite or all tests
FAILED_SUITES=()

if [ "$COVERAGE" = true ]; then
  run_coverage || FAILED_SUITES+=("coverage")
elif [ -n "$SPECIFIC_SUITE" ]; then
  case $SPECIFIC_SUITE in
    "order-numbers")
      run_test_suite "Order Numbers" "**/orderNumbers.test.ts" "Order Number Generation Tests" || FAILED_SUITES+=("order-numbers")
      ;;
    "stock-management")
      run_test_suite "Stock Management" "**/stockManagement.test.ts" "Invoice Stock Management Tests" || FAILED_SUITES+=("stock-management")
      ;;
    "product-search")
      run_test_suite "Product Search" "**/productSearch.test.ts" "Product Search Functionality Tests" || FAILED_SUITES+=("product-search")
      ;;
    "coupons")
      run_test_suite "Coupons" "**/coupons.test.ts" "Coupon Discount Flow Tests" || FAILED_SUITES+=("coupons")
      ;;
    "checkout")
      run_test_suite "Checkout" "**/CheckoutClient.integration.test.tsx" "Checkout Integration Tests" || FAILED_SUITES+=("checkout")
      ;;
    "all")
      echo -e "\n${BLUE}🚀 Running all test suites${NC}"
      
      run_test_suite "Order Numbers" "**/orderNumbers.test.ts" "Order Number Generation Tests" || FAILED_SUITES+=("order-numbers")
      run_test_suite "Stock Management" "**/stockManagement.test.ts" "Invoice Stock Management Tests" || FAILED_SUITES+=("stock-management")
      run_test_suite "Product Search" "**/productSearch.test.ts" "Product Search Functionality Tests" || FAILED_SUITES+=("product-search")
      run_test_suite "Coupons" "**/coupons.test.ts" "Coupon Discount Flow Tests" || FAILED_SUITES+=("coupons")
      run_test_suite "Checkout" "**/CheckoutClient.integration.test.tsx" "Checkout Integration Tests" || FAILED_SUITES+=("checkout")
      ;;
  esac
else
  # Default: run all tests
  echo -e "\n${BLUE}🚀 Running all test suites${NC}"
  
  run_test_suite "Order Numbers" "**/orderNumbers.test.ts" "Order Number Generation Tests" || FAILED_SUITES+=("order-numbers")
  run_test_suite "Stock Management" "**/stockManagement.test.ts" "Invoice Stock Management Tests" || FAILED_SUITES+=("stock-management")
  run_test_suite "Product Search" "**/productSearch.test.ts" "Product Search Functionality Tests" || FAILED_SUITES+=("product-search")
  run_test_suite "Coupons" "**/coupons.test.ts" "Coupon Discount Flow Tests" || FAILED_SUITES+=("coupons")
  run_test_suite "Checkout" "**/CheckoutClient.integration.test.tsx" "Checkout Integration Tests" || FAILED_SUITES+=("checkout")
fi

# Final summary
echo -e "\n${BLUE}📋 Test Summary${NC}"
echo "===================================="

if [ ${#FAILED_SUITES[@]} -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
  echo -e "${GREEN}✅ Your code is ready for deployment${NC}"
  exit 0
else
  echo -e "${RED}❌ Failed test suites:${NC}"
  for suite in "${FAILED_SUITES[@]}"; do
    echo -e "${RED}   - $suite${NC}"
  done
  echo -e "\n${YELLOW}💡 Please fix the failing tests before deploying${NC}"
  exit 1
fi
