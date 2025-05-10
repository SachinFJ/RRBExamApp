// src/services/NotificationService.ts
import notifee, {
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  Channel,
} from '@notifee/react-native';

const CHANNEL_ID = 'railway_gk_app_channel'; // एक यूनिक चैनल ID

/**
 * Android के लिए नोटिफिकेशन चैनल बनाता है (या मौजूदा चैनल की जानकारी देता है)
 */
async function createNotificationChannel(): Promise<string> {
  const existingChannel = await notifee.getChannel(CHANNEL_ID);
  if (existingChannel) {
    console.log(`Channel ${CHANNEL_ID} already exists.`);
    return CHANNEL_ID;
  }

  const channel: Channel = {
    id: CHANNEL_ID,
    name: 'Railway GK App Notifications',
    sound: 'default',
    importance: AndroidImportance.HIGH, // महत्वपूर्ण नोटिफिकेशन्स के लिए
    lights: true, // लाइट ब्लिंक होगी
    vibration: true, // वाइब्रेशन होगा
  };
  await notifee.createChannel(channel);
  console.log(`Channel ${CHANNEL_ID} created.`);
  return CHANNEL_ID;
}

/**
 * यूजर से नोटिफिकेशन की अनुमति मांगता है
 */
export async function requestUserPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log('Notification permission granted.');
    // iOS के लिए foreground presentation options सेट करें (अगर ऐप खुली हो तब भी नोटिफिकेशन दिखे)
    await notifee.setForegroundPresentationOptions({
      alert: true,
      badge: true,
      sound: true,
    });
    return true;
  } else {
    console.log('Notification permission denied.');
    return false;
  }
}

/**
 * दिन में 10 बार दोहराई जाने वाली नोटिफिकेशन्स शेड्यूल करता है
 */
export async function scheduleDailyRepeatingNotifications() {
  try {
    // पहले से शेड्यूल की गई इस ऐप की नोटिफिकेशन्स को कैंसल करें ताकि डुप्लीकेट न हों
    // आप चाहें तो इसे और बेहतर बना सकते हैं, सिर्फ उन्हीं को कैंसल करें जो आप दोबारा शेड्यूल कर रहे हैं
    const scheduledNotificationIds = await notifee.getTriggerNotificationIds();
    if (scheduledNotificationIds.length > 0) {
        console.log('Cancelling previously scheduled notifications:', scheduledNotificationIds);
        await notifee.cancelAllNotifications(scheduledNotificationIds); // सभी ट्रिगर नोटिफिकेशन्स कैंसल करें
        // या await notifee.cancelTriggerNotifications(ids_array);
    }


    const channelId = await createNotificationChannel(); // सुनिश्चित करें कि चैनल मौजूद है

    const notificationTimes = [
      { hour: 7, minute: 0, id: 'GK_0700', title: '🌅 सुप्रभात!', body: 'आज का पहला ज्ञान मोती आपकी प्रतीक्षा कर रहा है। ऐप खोलें और सीखें!' },
      { hour: 8, minute: 30, id: 'GK_0830', title: '🚀 दिन की शानदार शुरुआत!', body: 'क्या आपने आज के करंट अफेयर्स पढ़े? अभी चेक करें!' },
      { hour: 10, minute: 0, id: 'GK_1000', title: '💡 दिमाग को चार्ज करें!', body: 'एक छोटा सा क्विज़ खेलकर अपनी याददाश्त परखें। आप तैयार हैं?' },
      { hour: 11, minute: 30, id: 'GK_1130', title: '🧐 क्या आप जानते हैं?', body: 'रेलवे परीक्षा से जुड़ा एक रोचक तथ्य सिर्फ आपके लिए!' },
      { hour: 13, minute: 0, id: 'GK_1300', title: '🍽️ लंच ब्रेक में थोड़ा ज्ञान!', body: '5 मिनट में कुछ महत्वपूर्ण वन-लाइनर्स रिवाइज करें।' },
      { hour: 16, minute: 25, id: 'GK_1500', title: '🔔 चुनौती का समय!', body: 'आज के सबसे कठिन प्रश्न का सामना करने के लिए तैयार हो जाएं।' },
      { hour: 17, minute: 0, id: 'GK_1700', title: '📈 अपनी प्रगति देखें!', body: 'क्या आप आज के लर्निंग टारगेट के करीब हैं? एक नज़र डालें।' },
      { hour: 19, minute: 0, id: 'GK_1900', title: '🌙 शाम का अध्ययन सत्र!', body: 'दिनभर की थकान के बाद भी, थोड़ा और ज्ञान অর্জন करें।' },
      { hour: 20, minute: 30, id: 'GK_2030', title: '🎯 लक्ष्य भेदन!', body: 'सोने से पहले आज के महत्वपूर्ण टॉपिक्स का क्विक रिवीजन करें।' },
      { hour: 22, minute: 0, id: 'GK_2200', title: '✨ शानदार प्रयास!', body: 'आज आपने बहुत अच्छा किया। आराम करें और कल की नई चुनौतियों के लिए तैयार रहें। शुभ रात्रि!' },
    ];

    for (const notification of notificationTimes) {
      const triggerDate = new Date();
      triggerDate.setHours(notification.hour, notification.minute, 0, 0);

      // अगर आज का समय निकल गया है, तो कल के लिए शेड्यूल करें
      if (triggerDate.getTime() < Date.now()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification(
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          android: {
            channelId: channelId,
            pressAction: {
              id: 'default', // ऐप को लॉन्च करेगा
            },
            smallIcon: 'ic_launcher', // महत्वपूर्ण: यह आइकॉन आपके drawable में होना चाहिए
            // largeIcon: 'ic_large_icon', // Optional: बड़ा आइकॉन
            importance: AndroidImportance.HIGH,
            // style: { type: AndroidStyle.BIGTEXT, text: notification.body }, // लंबा टेक्स्ट दिखाने के लिए
          },
          ios: {
            sound: 'default',
            // foregroundPresentationOptions: // यह requestUserPermission में सेट किया जा चुका है
          }
        },
        trigger,
      );
      console.log(`Notification ID "${notification.id}" scheduled for ${triggerDate.toLocaleString()}`);
    }
    console.log('All 10 daily notifications scheduled successfully.');

  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

/**
 * नोटिफिकेशन सिस्टम को इनिशियलाइज़ करता है
 */
export async function initializeNotifications() {
  const permissionGranted = await requestUserPermission();
  if (permissionGranted) {
    await scheduleDailyRepeatingNotifications();
  } else {
    console.log('Notifications cannot be scheduled as permission was denied.');
    // आप चाहें तो यूजर को दोबारा परमिशन देने के लिए प्रेरित कर सकते हैं
  }
}