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
      // Handle different newline formats - more aggressive approach
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (privateKey) {
        // Remove any quotes that might wrap the key
        privateKey = privateKey.replace(/^["']|["']$/g, '');
        
        // Try multiple replacement strategies
        // First, replace literal \\n with \n
        privateKey = privateKey.replace(/\\\\n/g, "\n");
        
        // Then replace \n (without double backslash) with actual newlines
        privateKey = privateKey.replace(/\\n/g, "\n");
        
        // If key is completely on one line (no newlines at all), manually format it
        if (!privateKey.includes("\n")) {
          // Find the key content between BEGIN and END
          const beginMarker = "-----BEGIN PRIVATE KEY-----";
          const endMarker = "-----END PRIVATE KEY-----";
          
          if (privateKey.includes(beginMarker) && privateKey.includes(endMarker)) {
            // Extract the key content
            const startIndex = privateKey.indexOf(beginMarker) + beginMarker.length;
            const endIndex = privateKey.indexOf(endMarker);
            const keyContent = privateKey.substring(startIndex, endIndex);
            
            // Reconstruct with proper line breaks
            privateKey = beginMarker + "\n" + keyContent.trim() + "\n" + endMarker + "\n";
          }
        }
        
        console.log("Private key has newlines:", privateKey.includes("\n"));
        console.log("Private key starts with:", privateKey.substring(0, 50));
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
