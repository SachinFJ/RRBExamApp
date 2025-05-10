// src/screens/QuizScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quizQuestions, QuizQuestion } from '../data/quizData'; // Assuming quizData.ts is in ../data/

const USER_HIGH_SCORE_KEY = '@UserHighScoreKey';
const USER_LAST_SCORE_KEY = '@UserLastScoreKey';
const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

// Keys needed to save data for HomeScreen (ensure these match HomeScreen's expected keys)
const LAST_QUIZ_CORRECT_KEY = '@LastQuizCorrectKey';
const LAST_QUIZ_WRONG_KEY = '@LastQuizWrongKey';
const LAST_QUIZ_SKIPPED_KEY = '@LastQuizSkippedKey';
const LAST_QUIZ_TIME_KEY = '@LastQuizTimeKey';
const LAST_QUIZ_ATTEMPTED_KEY = '@LastQuizAttemptedKey';

interface QuizQuestionWithMeta extends QuizQuestion {
  itemType?: 'quiz'; // To distinguish bookmarked quiz questions if you have other types
}

const QuizScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState<QuizQuestionWithMeta[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  // 'score' state will be derived from correctAnswersCount for final reporting
  const [isAnswerProcessed, setIsAnswerProcessed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // To give feedback on current answer
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0); // For live dashboard (explicit skips)
  const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [bookmarkedItems, setBookmarkedItems] = useState<QuizQuestionWithMeta[]>([]);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
        if (storedBookmarks) {
          const allBookmarks = JSON.parse(storedBookmarks);
          // Filter for quiz questions if other types of bookmarks exist
          const quizBookmarks = allBookmarks.filter(item => item.itemType === 'quiz' || !item.itemType);
          setBookmarkedItems(quizBookmarks);
        }
      } catch (e) {
        console.error("Failed to load bookmarks.", e);
      }
    };
    loadBookmarks();
  }, []);

  useEffect(() => {
    let isActive = questions.length > 0 && currentQuestionIndex < questions.length;

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

  useEffect(() => {
    // Shuffle and set questions (load all questions by removing slice)
    const shuffledQuestions = [...quizQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions.map(q => ({ ...q, itemType: 'quiz' }))); // Add itemType for consistency
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    // score state is not directly set here, correctAnswersCount will be used
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
      finalizeQuiz("Quiz Finished!");
    }
  };

  const handleNextQuestion = () => {
    // If "Next" is pressed without an answer being processed for the current question
    if (!isAnswerProcessed && selectedOptionIndex === null && currentQuestionIndex < questions.length) {
      setSkippedCount((prevCount) => prevCount + 1);
    }
    moveToNextQuestionLogic();
  };

  const handleSubmitQuiz = () => {
    Alert.alert(
      "Submit Quiz",
      "Are you sure you want to submit the quiz now?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => finalizeQuiz("Quiz Submitted Early"), style: 'destructive' }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const finalizeQuiz = async (title: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const totalQuestionsInSession = questions.length;
    
    // Robust calculation for final skipped count:
    // Any question not answered correctly or incorrectly is considered skipped.
    const finalSkippedCount = totalQuestionsInSession - (correctAnswersCount + wrongAnswersCount);
    
    const finalScoreString = `${correctAnswersCount}/${totalQuestionsInSession}`;

    try {
      await AsyncStorage.setItem(USER_LAST_SCORE_KEY, finalScoreString);
      const storedHighScore = await AsyncStorage.getItem(USER_HIGH_SCORE_KEY);
      if (storedHighScore) {
        const [storedScoreNumStr] = storedHighScore.split('/');
        const storedScoreNum = parseInt(storedScoreNumStr, 10);
        if (correctAnswersCount > storedScoreNum) {
          await AsyncStorage.setItem(USER_HIGH_SCORE_KEY, finalScoreString);
        }
      } else {
        await AsyncStorage.setItem(USER_HIGH_SCORE_KEY, finalScoreString);
      }

      // ---- SAVE ALL INDIVIDUAL STATS FOR HOMESCREEN ----
      await AsyncStorage.setItem(LAST_QUIZ_CORRECT_KEY, correctAnswersCount.toString());
      await AsyncStorage.setItem(LAST_QUIZ_WRONG_KEY, wrongAnswersCount.toString());
      await AsyncStorage.setItem(LAST_QUIZ_SKIPPED_KEY, finalSkippedCount.toString());
      await AsyncStorage.setItem(LAST_QUIZ_TIME_KEY, formatTime(elapsedTime)); // formatTime returns a string
      await AsyncStorage.setItem(LAST_QUIZ_ATTEMPTED_KEY, totalQuestionsInSession.toString());
      // ----------------------------------------------------

    } catch (e) {
      console.error("Failed to save scores and quiz stats.", e);
    }
    
    // Set index beyond questions length to signify quiz end for UI rendering
    setCurrentQuestionIndex(questions.length); 

    Alert.alert(
      title,
      `Total time taken: ${formatTime(elapsedTime)}\nYour final score is: ${finalScoreString}\nCorrect: ${correctAnswersCount}, Wrong: ${wrongAnswersCount}, Skipped: ${finalSkippedCount}`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const toggleBookmark = async () => {
    if (!questions[currentQuestionIndex]) return;

    const currentQ = questions[currentQuestionIndex];
    // Ensure question has an ID, crucial for bookmarking
    if (!currentQ.id) {
      console.warn("Question is missing an ID. Cannot bookmark.");
      Alert.alert("Error", "This question cannot be bookmarked (ID missing).");
      return;
    }

    let allStoredBookmarksRaw = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
    let allStoredBookmarks: QuizQuestionWithMeta[] = allStoredBookmarksRaw ? JSON.parse(allStoredBookmarksRaw) : [];

    // Ensure the item being bookmarked has the itemType
    const bookmarkQuizItem: QuizQuestionWithMeta = { ...currentQ, itemType: 'quiz' };

    const existingBookmarkIndex = allStoredBookmarks.findIndex(
      (bq) => bq.id === bookmarkQuizItem.id && bq.itemType === 'quiz' // Check itemType for safety
    );

    if (existingBookmarkIndex > -1) {
      allStoredBookmarks.splice(existingBookmarkIndex, 1); // Remove if exists
    } else {
      allStoredBookmarks.push(bookmarkQuizItem); // Add if not exists
    }

    try {
      await AsyncStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(allStoredBookmarks));
      // Update local state of bookmarked items for immediate UI feedback
      const currentQuizBookmarks = allStoredBookmarks.filter(item => item.itemType === 'quiz');
      setBookmarkedItems(currentQuizBookmarks);
    } catch (e) {
      console.error("Failed to update bookmarks.", e);
      Alert.alert("Error", "Failed to update bookmarks.");
    }
  };

  // Loading and finished states rendering
  if (questions.length === 0 && currentQuestionIndex === 0) { // Initial loading
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (currentQuestionIndex >= questions.length && questions.length > 0) { // Quiz finished
    return (
        <View style={styles.container}>
            <Text style={styles.loadingText}>Quiz finished. View results in the alert or go back.</Text>
        </View>
    );
  }
  
  // Should not happen if questions are loaded, but as a fallback
  if (!questions[currentQuestionIndex]) {
      return <View style={styles.container}><Text style={styles.loadingText}>Error loading question.</Text></View>;
  }


  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentBookmarked = currentQuestion.id ? 
    bookmarkedItems.some(bq => bq.id === currentQuestion.id && bq.itemType === 'quiz') : false;


  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.dashboard}>
          <Text style={styles.dashboardText}>Score: {correctAnswersCount}</Text>
          <Text style={styles.dashboardText}>Correct: {correctAnswersCount}</Text>
          <Text style={styles.dashboardText}>Wrong: {wrongAnswersCount}</Text>
          <Text style={styles.dashboardText}>Skipped (Live): {skippedCount}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Time: {formatTime(elapsedTime)}</Text>
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
            Question {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
            <Text style={[styles.bookmarkIcon, isCurrentBookmarked ? styles.bookmarkedActiveIcon : styles.bookmarkedInactiveIcon]}>
              {isCurrentBookmarked ? '🔖' : '✩'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.examName && (
          <Text style={styles.examNameText}>
            Exam Reference: {currentQuestion.examName}
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
            } else { // Other options when answer is processed (not selected, not correct)
              optionStyle = [styles.optionButton, styles.disabledOptionButton];
            }
          } else { // Before answer is processed
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

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
            style={[styles.actionButton, styles.submitButton]}
            onPress={handleSubmitQuiz}
            disabled={currentQuestionIndex >= questions.length} // Disable if quiz already ended
        >
            <Text style={styles.actionButtonText}>Submit Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.actionButton, styles.nextButton]}
            onPress={handleNextQuestion}
            // No specific disabled style, action always available until quiz explicitly ends via finalizeQuiz
        >
            <Text style={styles.actionButtonText}>
                {currentQuestionIndex === questions.length - 1 
                    ? 'Finish Quiz' 
                    : (isAnswerProcessed ? 'Next Question' : 'Skip & Next')}
            </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: '#f0f4f8', // Light background for the whole screen
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap', // Allow items to wrap on smaller screens
    backgroundColor: '#e9ecef', // Light grey for dashboard
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    flex: 1, // Take available space
    marginRight: 8,
    elevation: 1,
  },
  dashboardText: {
    fontSize: 12, // Slightly smaller for more info
    fontWeight: '600',
    color: '#495057', // Dark grey text
    marginHorizontal: 3, // Space out items
  },
  timerContainer: {
    backgroundColor: '#ffc107', // Yellow for timer
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 70, // Ensure timer text fits
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  timerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212529', // Dark text on yellow
  },
  mainEmojiContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mainEmojiText: {
    fontSize: 48, // Large emoji
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#34495e', // Muted color for loading/info text
  },
  questionCard: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#ffffff', // White card for question
    borderRadius: 10,
    elevation: 2, // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumberText: {
    fontSize: 13,
    color: '#6c757d', // Grey for question number
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 6, // Make bookmark easier to tap
  },
  bookmarkIcon: {
    fontSize: 24,
  },
  bookmarkedActiveIcon: {
    color: '#ffc107', // Gold/Yellow for active bookmark
  },
  bookmarkedInactiveIcon: {
    color: '#adb5bd', // Light grey for inactive bookmark
  },
  questionText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#212529', // Dark text for question
    lineHeight: 24, // Improve readability
    marginBottom: 8,
  },
  examNameText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#007bff', // Blue for exam name
    marginTop: 5,
    textAlign: 'right',
  },
  optionsContainer: {
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#ffffff', // White background for options
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 5, // Space between options
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6', // Light border
    elevation: 1,
  },
  optionText: {
    fontSize: 15,
    color: '#212529', // Dark text for option
  },
  selectedOptionButton: {
    backgroundColor: '#cfe2ff', // Light blue for selected (before processing)
    borderColor: '#007bff', // Blue border
  },
  correctOptionButton: {
    backgroundColor: '#d1e7dd', // Light green for correct
    borderColor: '#198754', // Green border
  },
  correctOptionText: {
    color: '#0f5132', // Dark green text
    fontWeight: 'bold',
  },
  incorrectOptionButton: {
    backgroundColor: '#f8d7da', // Light red for incorrect
    borderColor: '#dc3545', // Red border
  },
  incorrectOptionText: {
    color: '#721c24', // Dark red text
    fontWeight: 'bold',
  },
  disabledOptionButton: { // Style for other options after one is answered
    backgroundColor: '#f8f9fa', // Very light grey, almost white
    borderColor: '#e9ecef',
    opacity: 0.7, // Make them look slightly faded
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out buttons
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    flex: 1, // Make buttons share width
  },
  submitButton: {
    backgroundColor: '#dc3545', // Red for Submit
    marginRight: 8, // Space between Submit and Next
  },
  nextButton: {
    backgroundColor: '#007bff', // Blue for Next/Finish
    marginLeft: 8, // Space if Submit button is not present, or balances marginRight
  },
  actionButtonText: {
    color: '#ffffff', // White text on buttons
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default QuizScreen;