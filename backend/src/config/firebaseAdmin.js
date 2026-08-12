import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";

const SERVICE_ACCOUNT_PATH = fileURLToPath(
  new URL("./serviceAccountKey.json", import.meta.url)
);

let adminAuth = null;

if (existsSync(SERVICE_ACCOUNT_PATH)) {
  try {
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH));

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    adminAuth = getAuth();
  } catch (error) {
    console.error(
      "Firebase Admin initialization failed. Wallet OTP payments will be unavailable:",
      error.message
    );
    adminAuth = null;
  }
} else {
  console.warn(
    "⚠️  serviceAccountKey.json not found — Firebase OTP wallet payments are disabled. " +
      "Add backend/src/config/serviceAccountKey.json to enable them."
  );
}

export { adminAuth };
