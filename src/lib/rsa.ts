import crypto from "crypto";

/**
 * Generates a 2048-bit RSA keypair.
 * Returns both keys in PEM format.
 */
export function generateRSAKeypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

/**
 * Signs a payload using SHA-256 and the provided RSA private key.
 * 
 * @param data The JSON object to sign
 * @param privateKeyPEM The private key in PEM format
 * @returns The base64 encoded signature
 */
export function signPayload(data: any, privateKeyPEM: string): string {
  const payloadString = JSON.stringify(data);
  const sign = crypto.createSign("SHA256");
  sign.update(payloadString);
  sign.end();
  
  return sign.sign(privateKeyPEM, "base64");
}

/**
 * Derives a public key from a private key.
 * Used if the user pastes a private key and we need to figure out the public key.
 * 
 * @param privateKeyPEM The private key in PEM format
 * @returns The public key in PEM format
 */
export function derivePublicKey(privateKeyPEM: string): string {
  const keyObject = crypto.createPrivateKey(privateKeyPEM);
  return crypto.createPublicKey(keyObject).export({
    type: "spki",
    format: "pem"
  }) as string;
}
