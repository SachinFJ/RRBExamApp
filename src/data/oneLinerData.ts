// src/data/oneLinerData.ts

export interface OneLinerQuestion {
  id: string; // प्रश्न का यूनिक आईडी
  question: string; // प्रश्न का टेक्स्ट
  answer: string; // उत्तर का टेक्स्ट
  subject?: string; // वैकल्पिक: विषय
}

export const oneLinerQuestions: OneLinerQuestion[] = [
  {
    id: 'ol1',
    question: 'भारत के वर्तमान प्रधानमंत्री कौन हैं?',
    answer: 'श्री नरेन्द्र मोदी', // कृपया इसे वर्तमान जानकारी के अनुसार अपडेट करें
    subject: 'राजनीति',
  },
  {
    id: 'ol2',
    question: 'पृथ्वी पर सबसे ऊँचा पर्वत कौन सा है?',
    answer: 'माउंट एवरेस्ट',
    subject: 'भूगोल',
  },
  {
    id: 'ol3',
    question: 'प्रकाश की गति कितनी होती है?',
    answer: 'लगभग 299,792 किलोमीटर प्रति सेकंड',
    subject: 'विज्ञान',
  },
  // ... आप यहाँ और प्रश्न जोड़ सकते हैं
];
