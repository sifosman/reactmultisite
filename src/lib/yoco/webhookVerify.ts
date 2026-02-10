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

  // The header can contain multiple entries separated by spaces, e.g.
  // "v1,abc= v1,def= v2,ghi=". Accept if ANY v1 signature matches.
  const candidates = signatureHeader
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [version, sig] = entry.split(",");
      return { version, sig };
    })
    .filter((x) => x.version === "v1" && typeof x.sig === "string" && x.sig.length > 0);

  for (const c of candidates) {
    try {
      if (
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(c.sig)
        )
      ) {
        return true;
      }
    } catch {
      // ignore and try next candidate
    }
  }

  return false;
}
