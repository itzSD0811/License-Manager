import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || "";
  if (key.length !== 32) {
    // If not exactly 32 bytes, pad or truncate it to be safe (though they should provide 32)
    return crypto.createHash("sha256").update(key || "default-key").digest();
  }
  return Buffer.from(key);
}

export function encryptString(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decryptString(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText; // might be plaintext
  try {
    const [ivHex, contentHex, authTagHex] = encryptedText.split(":");
    if (!ivHex || !contentHex || !authTagHex) return encryptedText;
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(contentHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return encryptedText; // fallback if decryption fails
  }
}
