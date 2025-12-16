import crypto from "crypto";

export function verifyYocoWebhook({
  rawBody,
  headers,
  secret,
}: {
  rawBody: string;
  headers: Headers;
  secret: string;
}) {
  const webhookId = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");

  if (!webhookId || !timestamp || !signatureHeader) {
    return false;
  }

  const signedContent = `${webhookId}.${timestamp}.${rawBody}`;

  // Secret is in the form "whsec_<base64>="
  const parts = secret.split("_");
  const base64Part = parts.length > 1 ? parts[1] : "";
  const secretBytes = Buffer.from(base64Part, "base64");

  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const first = signatureHeader.split(" ")[0];
  const actualSignature = first.split(",")[1];

  if (!actualSignature) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(actualSignature)
    );
  } catch {
    return false;
  }
}
