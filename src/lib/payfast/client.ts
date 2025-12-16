/**
 * PayFast Configuration for South African Market
 * Used for subscription billing to charge clients monthly
 * 
 * PayFast supports recurring payments via their subscription API
 * https://developers.payfast.co.za/docs#subscriptions
 */

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  testMode: boolean;
}

export function getPayFastConfig(): PayFastConfig | null {
  if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY) {
    return null;
  }
  
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE || "",
    testMode: process.env.PAYFAST_TEST_MODE === "true",
  };
}

export function isPayFastConfigured(): boolean {
  return Boolean(
    process.env.PAYFAST_MERCHANT_ID &&
    process.env.PAYFAST_MERCHANT_KEY
  );
}

/**
 * Generate PayFast payment URL for subscription
 */
export function getPayFastBaseUrl(testMode: boolean): string {
  return testMode 
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

/**
 * Generate MD5 signature for PayFast
 */
export function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  // Create parameter string
  let pfOutput = "";
  for (const key of Object.keys(data).sort()) {
    if (data[key] !== "") {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}&`;
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  
  // Add passphrase if provided
  if (passphrase) {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }

  // Generate MD5 hash
  const crypto = require("crypto");
  return crypto.createHash("md5").update(getString).digest("hex");
}
