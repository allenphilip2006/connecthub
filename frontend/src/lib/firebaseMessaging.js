// Optional FCM bootstrap. Loads only if env variables are present.
// Requires VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_VAPID_KEY

export async function initMessaging() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_SENDER_ID,
    VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_VAPID_KEY
  } = import.meta.env;

  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_PROJECT_ID || !VITE_FIREBASE_SENDER_ID || !VITE_FIREBASE_APP_ID || !VITE_FIREBASE_VAPID_KEY) {
    return null; // FCM disabled if keys are missing
  }

  const { initializeApp } = await import('firebase/app');
  const { getMessaging, getToken, onMessage, isSupported } = await import('firebase/messaging');

  if (!(await isSupported())) return null;

  const firebaseConfig = {
    apiKey: VITE_FIREBASE_API_KEY,
    projectId: VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: VITE_FIREBASE_SENDER_ID,
    appId: VITE_FIREBASE_APP_ID
  };
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
    // Store token for your backend if needed:
    localStorage.setItem('fcm_token', token || '');
    
    // Send to backend
    if (token) {
      try {
        const { userService } = await import('../services/api');
        await userService.updateFcmToken(token);
      } catch (err) {
        console.error("Failed to sync FCM token with backend", err);
      }
    }

    // Foreground messages
    onMessage(messaging, (payload) => {
      if (payload?.notification?.title) {
        const title = payload.notification.title;
        const opts = { body: payload.notification.body || '', icon: payload.notification.icon };
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try { new Notification(title, opts); } catch { /* ignore */ }
        }
      }
    });
    return token;
  } catch {
    return null;
  }
}
