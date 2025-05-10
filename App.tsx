// App.tsx

import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator'; // आपका मौजूदा नेविगेटर
import notifee, { EventType } from '@notifee/react-native'; // Notifee और EventType को इंपोर्ट करें
import { initializeNotifications } from './src/services/NotificationService'; // हमारी नोटिफिकेशन सर्विस

const App = () => {
  useEffect(() => {
    // ऐप के शुरू होते ही नोटिफिकेशन्स को इनिशियलाइज़ करें
    // यह अनुमति मांगेगा और दैनिक नोटिफिकेशन्स शेड्यूल करेगा
    initializeNotifications();

    // --- Notifee Event Listeners ---

    // 1. Foreground event listener (जब ऐप खुली हो और नोटिफिकेशन आए)
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      const { notification, pressAction } = detail;
      console.log('[Foreground Event] Type:', EventType[type], 'Detail:', detail);

      if (notification) {
        console.log('[Foreground Notification Received] ID:', notification.id);
      }

      switch (type) {
        case EventType.DISMISSED:
          console.log('[Foreground] User dismissed notification:', notification?.id);
          break;
        case EventType.PRESS:
          console.log('[Foreground] User pressed notification:', notification?.id);
          // अगर नोटिफिकेशन पर क्लिक करने पर कोई खास एक्शन लेना हो, जैसे किसी स्क्रीन पर नेविगेट करना
          // if (notification?.data?.navigateToScreen) {
          //   // AppNavigator.navigate(notification.data.navigateToScreen); // अपने नेविगेशन लॉजिक के अनुसार
          // }
          break;
      }
    });

    // 2. Background event listener (जब ऐप बंद हो या बैकग्राउंड में हो और यूजर नोटिफिकेशन पर क्लिक करे)
    // यह फंक्शन एक अनसब्सक्राइब फंक्शन रिटर्न नहीं करता है, इसे सीधे कॉल किया जाता है।
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;
      console.log('[Background Event] Type:', EventType[type], 'Detail:', detail);

      if (notification) {
        console.log('[Background Notification Interacted] ID:', notification.id);
      }

      // आमतौर पर, EventType.PRESS ही बैकग्राउंड में सबसे महत्वपूर्ण होता है
      if (type === EventType.PRESS && pressAction?.id === 'default') {
        console.log('[Background] User pressed notification to open app:', notification?.id);
        // ऐप अपने आप खुल जाएगी। अगर कोई खास स्क्रीन पर भेजना हो तो यह जानकारी
        // आप initialNotification के जरिए हैंडल कर सकते हैं जब ऐप पूरी तरह लोड हो जाए।
        // Notifee.getInitialNotification() का इस्तेमाल किया जा सकता है।
      }
      // आप चाहें तो यहां कुछ बैकग्राउंड टास्क कर सकते हैं, लेकिन यह सीमित होना चाहिए।
    });

    // 3. Check if app was opened from a notification (जब ऐप पूरी तरह बंद थी)
    const handleInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        console.log('[Initial Notification] App opened from notification:', initialNotification.notification);
        console.log('[Initial Notification] Press action:', initialNotification.pressAction);
        // यहां आप नोटिफिकेशन डेटा के आधार पर किसी खास स्क्रीन पर नेविगेट कर सकते हैं
        // if (initialNotification.notification.data?.navigateToScreen) {
        //   // सुनिश्चित करें कि नेविगेटर तैयार है
        //   // AppNavigator.navigate(initialNotification.notification.data.navigateToScreen);
        // }
      }
    };

    handleInitialNotification();

    // Cleanup: जब कंपोनेंट अनमाउंट हो तो फोरग्राउंड लिस्नर को अनसब्सक्राइब करें
    return () => {
      unsubscribeForeground();
    };
  }, []); // खाली dependency array यह सुनिश्चित करता है कि यह सिर्फ एक बार चले

  return <AppNavigator />; // आपका मौजूदा ऐप नेविगेटर
};

export default App;
