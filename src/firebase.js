import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBa-9-GMIu_4xBjFVFnlMupm87eN3a_WeM",
  authDomain: "tabazar-8c418.firebaseapp.com",
  projectId: "tabazar-8c418",
  storageBucket: "tabazar-8c418.firebasestorage.app",
  messagingSenderId: "1067578057027",
  appId: "1:1067578057027:web:tabazar_react_web",
};

let firebaseApp = null;
let auth = null;

try {
  firebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();
  auth = getAuth(firebaseApp);
} catch (err) {
  console.warn("Firebase initialization skipped:", err);
}

export { auth };

// Correctly export a promise that resolves to messaging instance (or null)
export const getMessagingObject = async () => {
  try {
    if (!firebaseApp) return null;
    const isSupportedBrowser = await isSupported();
    if (isSupportedBrowser) {
      return getMessaging(firebaseApp);
    }
    return null;
  } catch (err) {
    console.error("Messaging not supported:", err);
    return null;
  }
};

// fetchToken function
export const fetchToken = async (setTokenFound, setFcmToken) => {
  try {
    const vapidKey = "";
    if (!vapidKey) {
      if (setTokenFound) setTokenFound(false);
      return;
    }

    const messaging = await getMessagingObject();
    if (!messaging) return;

    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey,
    });

    if (currentToken) {
      setTokenFound(true);
      setFcmToken(currentToken);
    } else {
      setTokenFound(false);
      setFcmToken();
    }
  } catch (err) {
    console.warn("Token fetch error (skipped):", err);
  }
};

// onMessageListener function
export const onMessageListener = async () =>
  new Promise(async (resolve, reject) => {
    try {
      const messaging = await getMessagingObject();
      if (!messaging) return;

      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } catch (err) {
      reject(err);
    }
  });
