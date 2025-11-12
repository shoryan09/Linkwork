const admin = require("firebase-admin");

// Only initialize Firebase if credentials are provided
if (!admin.apps.length) {
  try {
    // Option 1: Use JSON file (recommended for Render)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized successfully (via JSON file)");
    } 
    // Option 2: Use environment variables (fallback)
    else if (process.env.FIREBASE_PROJECT_ID) {
      // Handle different newline formats
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey) {
        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, "\n");
        // If still no newlines, might be stored as single line - try to fix
        if (!privateKey.includes("\n") && privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
          privateKey = privateKey
            .replace(/-----BEGIN PRIVATE KEY-----/g, "-----BEGIN PRIVATE KEY-----\n")
            .replace(/-----END PRIVATE KEY-----/g, "\n-----END PRIVATE KEY-----\n");
        }
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized successfully (via env vars)");
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = { admin, verifyFirebaseToken };
