const admin = require("firebase-admin");

// Only initialize Firebase if credentials are provided
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization failed:", error.message);
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
