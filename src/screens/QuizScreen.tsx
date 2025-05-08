// src/screens/QuizScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage इम्पोर्ट करें
import { quizQuestions, QuizQuestion } from '../data/quizData'; // सुनिश्चित करें पाथ सही हो और QuizQuestion में id हो

// AsyncStorage Keys (HomeScreen के साथ सिंक में)
const USER_HIGH_SCORE_KEY = '@UserHighScoreKey';
const USER_LAST_SCORE_KEY = '@UserLastScoreKey';
const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

// QuizQuestion इंटरफ़ेस में id होना चाहिए
// मान लें कि QuizQuestion इंटरफ़ेस ऐसा है:
// export interface QuizQuestion {
//   id: string; // या number - यह यूनिक होना चाहिए
//   question: string;
//   options: string[];
//   correctAnswerIndex: number;
//   examName?: string;
// }


const QuizScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerProcessed, setIsAnswerProcessed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // बुकमार्क के लिए स्टेट
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<QuizQuestion[]>([]);

  // मौजूदा बुकमार्क लोड करें
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
        if (storedBookmarks) {
          setBookmarkedQuestions(JSON.parse(storedBookmarks));
        }
      } catch (e) {
        console.error("Failed to load bookmarks.", e);
      }
    };
    loadBookmarks();
  }, []);

  // टाइमर को मैनेज करने के लिए useEffect
  useEffect(() => {
    let isActive = questions.length > 0 && currentQuestionIndex < questions.length && currentQuestionIndex < questions.length;

    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [questions.length, currentQuestionIndex]);

  // क्विज़ के लिए प्रश्नों को लोड और शफल करें
  useEffect(() => {
    const shuffledQuestions = [...quizQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions.slice(0, 10)); // उदाहरण के लिए 10 प्रश्न, या सभी के लिए .slice हटा दें
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setIsAnswerProcessed(false);
    setIsCorrect(null);
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setSkippedCount(0);
    setFeedbackEmoji(null);
    setElapsedTime(0);
  }, []);


  const handleOptionSelect = (index: number) => {
    if (isAnswerProcessed) return;

    setSelectedOptionIndex(index);
    const currentQuestion = questions[currentQuestionIndex];
    const correct = currentQuestion.correctAnswerIndex === index;

    setIsCorrect(correct);
    if (correct) {
      setScore((prevScore) => prevScore + 1);
      setCorrectAnswersCount((prevCount) => prevCount + 1);
      setFeedbackEmoji('😄');
    } else {
      setWrongAnswersCount((prevCount) => prevCount + 1);
      setFeedbackEmoji('😟');
    }
    setIsAnswerProcessed(true);
  };

  const moveToNextQuestionLogic = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedOptionIndex(null);
      setIsAnswerProcessed(false);
      setIsCorrect(null);
      setFeedbackEmoji(null);
    } else {
      finalizeQuiz("क्विज़ समाप्त!");
    }
  };

  const handleNextQuestion = () => {
    if (!isAnswerProcessed && questions.length > 0) { // सुनिश्चित करें कि प्रश्न मौजूद हैं
      setSkippedCount((prevCount) => prevCount + 1);
    }
    moveToNextQuestionLogic();
  };

  const finalizeQuiz = async (title: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const finalScoreString = `${score}/${questions.length}`;

    try {
      // पिछला स्कोर सहेजें
      await AsyncStorage.setItem(USER_LAST_SCORE_KEY, finalScoreString);

      // उच्चतम स्कोर सहेजें
      const storedHighScore = await AsyncStorage.getItem(USER_HIGH_SCORE_KEY);
      if (storedHighScore) {
        const [storedScoreNumStr] = storedHighScore.split('/');
        const storedScoreNum = parseInt(storedScoreNumStr, 10);
        if (score > storedScoreNum) {
          await AsyncStorage.setItem(USER_HIGH_SCORE_KEY, finalScoreString);
        }
      } else {
        // कोई उच्चतम स्कोर पहले से नहीं है, तो इसे सहेजें
        await AsyncStorage.setItem(USER_HIGH_SCORE_KEY, finalScoreString);
      }
    } catch (e) {
      console.error("Failed to save scores.", e);
    }
    
    // setCurrentQuestionIndex को questions.length पर सेट करें ताकि "क्विज़ समाप्त हो चुका है" संदेश दिखे
    // Alert दिखने से पहले ताकि बैकग्राउंड में क्विज UI न दिखे
    setCurrentQuestionIndex(questions.length);


    Alert.alert(
      title,
      `लिया गया कुल समय: ${formatTime(elapsedTime)}\nआपका अंतिम स्कोर है: ${finalScoreString}\nसही: ${correctAnswersCount}, गलत: ${wrongAnswersCount}, स्किप: ${skippedCount}`,
      [{ text: "ठीक है", onPress: () => navigation.goBack() }]
    );
  };

  const toggleBookmark = async () => {
    if (!questions[currentQuestionIndex]) return; // यदि कोई प्रश्न नहीं है तो कुछ न करें

    const currentQ = questions[currentQuestionIndex];
    // प्रश्न में यूनिक 'id' प्रॉपर्टी होनी चाहिए
    if (!currentQ.id) {
        console.warn("Question is missing an ID. Cannot bookmark.");
        Alert.alert("त्रुटि", "इस प्रश्न को बुकमार्क नहीं किया जा सकता (ID नहीं है)।");
        return;
    }

    let updatedBookmarks = [...bookmarkedQuestions];
    const existingBookmarkIndex = updatedBookmarks.findIndex(bq => bq.id === currentQ.id);

    if (existingBookmarkIndex > -1) {
      // पहले से बुकमार्क है, तो हटाएं
      updatedBookmarks.splice(existingBookmarkIndex, 1);
    } else {
      // बुकमार्क नहीं है, तो जोड़ें
      updatedBookmarks.push(currentQ);
    }

    try {
      await AsyncStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(updatedBookmarks));
      setBookmarkedQuestions(updatedBookmarks); // लोकल स्टेट अपडेट करें
    } catch (e) {
      console.error("Failed to update bookmarks.", e);
      Alert.alert("त्रुटि", "बुकमार्क अपडेट करने में विफल।");
    }
  };

  if (questions.length === 0 && currentQuestionIndex >= questions.length) {
    // यह स्थिति तब है जब प्रश्न लोड नहीं हुए हैं या क्विज़ वास्तव में समाप्त हो चुका है
    return (
        <View style={styles.container}>
            <Text style={styles.loadingText}>
                {questions.length === 0 && currentQuestionIndex === 0 ? "प्रश्न लोड हो रहे हैं..." : "क्विज़ समाप्त हो चुका है।"}
            </Text>
        </View>
    );
  }


  // यदि currentQuestionIndex सीमा से बाहर है (लोडिंग या क्विज़ समाप्त होने की स्थिति)
  if (currentQuestionIndex >= questions.length && questions.length > 0) {
    return <View style={styles.container}><Text style={styles.loadingText}>क्विज़ समाप्त हो चुका है।</Text></View>;
  }
  if (questions.length === 0 ) {
     return <View style={styles.container}><Text style={styles.loadingText}>प्रश्न लोड हो रहे हैं...</Text></View>;
  }


  const currentQuestion = questions[currentQuestionIndex];
  // वर्तमान प्रश्न बुकमार्क है या नहीं
  const isCurrentBookmarked = currentQuestion && currentQuestion.id ? bookmarkedQuestions.some(bq => bq.id === currentQuestion.id) : false;


  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.dashboard}>
          <Text style={styles.dashboardText}>स्कोर: {score}</Text>
          <Text style={styles.dashboardText}>सही: {correctAnswersCount}</Text>
          <Text style={styles.dashboardText}>गलत: {wrongAnswersCount}</Text>
          <Text style={styles.dashboardText}>स्किप: {skippedCount}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>समय: {formatTime(elapsedTime)}</Text>
        </View>
      </View>

      {isAnswerProcessed && feedbackEmoji && (
        <View style={styles.mainEmojiContainer}>
          <Text style={styles.mainEmojiText}>{feedbackEmoji}</Text>
        </View>
      )}

      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
            <Text style={styles.questionNumberText}>
                प्रश्न {currentQuestionIndex + 1} / {questions.length}
            </Text>
            <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
                <Text style={styles.bookmarkIcon}>{isCurrentBookmarked ? '🔖' : ' L '}</Text> 
                {/* ' L ' एक खाली बुकमार्क जैसा दिखेगा, आप असली आइकॉन इस्तेमाल कर सकते हैं */}
            </TouchableOpacity>
        </View>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.examName && (
          <Text style={styles.examNameText}>
            परीक्षा संदर्भ: {currentQuestion.examName}
          </Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          let optionStyle = styles.optionButton;
          let optionTextStyle = styles.optionText;
          let detailEmoji = '';

          if (isAnswerProcessed) {
            if (index === currentQuestion.correctAnswerIndex) {
              optionStyle = [styles.optionButton, styles.correctOptionButton];
              optionTextStyle = [styles.optionText, styles.correctOptionText];
              detailEmoji = '✅ ';
            } else if (index === selectedOptionIndex && !isCorrect) {
              optionStyle = [styles.optionButton, styles.incorrectOptionButton];
              optionTextStyle = [styles.optionText, styles.incorrectOptionText];
              detailEmoji = '❌ ';
            } else {
              optionStyle = [styles.optionButton, styles.disabledOptionButton];
            }
          } else {
            if (selectedOptionIndex === index) {
              optionStyle = [styles.optionButton, styles.selectedOptionButton];
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleOptionSelect(index)}
              disabled={isAnswerProcessed}
            >
              <Text style={optionTextStyle}>{detailEmoji}{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.actionButton, styles.nextButtonOnly, isAnswerProcessed ? {} : styles.disabledNextButton]}
        onPress={handleNextQuestion}
        // disabled={!isAnswerProcessed && selectedOptionIndex === null} // अगला बटन तब तक डिसेबल रखें जब तक कोई ऑप्शन न चुना जाए या उत्तर प्रोसेस न हो
      >
        <Text style={styles.actionButtonText}>अगला प्रश्न</Text>
      </TouchableOpacity>
    </View>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f8ff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-around', // स्पेस बेहतर करने के लिए
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flex: 1,
    marginRight: 10,
  },
  dashboardText: {
    fontSize: 12, // थोड़ा छोटा किया
    fontWeight: '600',
    color: '#495057',
  },
  timerContainer: {
    backgroundColor: '#ffc107',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80, // न्यूनतम चौड़ाई
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
  },
  mainEmojiContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mainEmojiText: {
    fontSize: 48,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#333',
  },
  questionCard: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 2,
  },
  questionHeader: { // प्रश्न संख्या और बुकमार्क बटन के लिए
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumberText: {
    fontSize: 14,
    color: '#6c757d',
    // marginBottom: 8, // questionHeader में चला गया
  },
  bookmarkButton: {
    padding: 5,
  },
  bookmarkIcon: {
    fontSize: 22, // आइकॉन का साइज़
    color: '#6c757d', // बुकमार्क आइकॉन का रंग
  },
  questionText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#212529',
    lineHeight: 25,
    marginBottom: 8,
  },
  examNameText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#4a5568',
    marginTop: 5,
    textAlign: 'right',
  },
  optionsContainer: {
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ced4da',
  },
  optionText: {
    fontSize: 15,
    color: '#212529',
  },
  selectedOptionButton: {
    backgroundColor: '#cfe2ff',
    borderColor: '#0d6efd',
  },
  correctOptionButton: {
    backgroundColor: '#d1e7dd',
    borderColor: '#198754',
  },
  correctOptionText: {
      color: '#0f5132',
  },
  incorrectOptionButton: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  incorrectOptionText: {
      color: '#842029',
  },
  disabledOptionButton: {
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef',
  },
  actionButton: {
    backgroundColor: '#0d6efd',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    marginTop: 10,
  },
  nextButtonOnly: {
      width: '100%',
  },
  disabledNextButton: { // यदि अगला बटन डिसेबल करना हो
    backgroundColor: '#a0cfff', // हल्का नीला
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuizScreen;