// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import QuizScreen from '../screens/QuizScreen';
import OneLinerScreen from '../screens/OneLinerScreen';
import BookmarkedScreen from '../screens/BookmarkedScreen'; // <<--- BookmarkedScreen को इम्पोर्ट करें

export type RootStackParamList = {
  Home: undefined;
  Quiz: undefined;
  OneLiner: undefined;
  BookmarkedScreen: undefined; // <<--- BookmarkedScreen को यहाँ टाइप में जोड़ें
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        // screenOptions={{ headerShown: false }} // इसे यहाँ से हटा सकते हैं यदि आप प्रत्येक स्क्रीन के लिए अलग से नियंत्रित करना चाहते हैं
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} // होम स्क्रीन पर हेडर नहीं चाहिए
        />
        <Stack.Screen 
          name="Quiz" 
          component={QuizScreen} 
          options={{ 
            title: 'क्विज़ प्रैक्टिस', // स्क्रीन का टाइटल
            headerShown: true, // इस स्क्रीन के लिए हेडर दिखाएं
          }} 
        />
        <Stack.Screen 
          name="OneLiner" 
          component={OneLinerScreen} 
          options={{ 
            title: 'वन-लाइनर रिविज़न', // स्क्रीन का टाइटल
            headerShown: true, // इस स्क्रीन के लिए हेडर दिखाएं
          }} 
        />
        <Stack.Screen //                                  <<--- नई स्क्रीन यहाँ जोड़ें
          name="BookmarkedScreen"
          component={BookmarkedScreen}
          options={{
            title: 'आपके बुकमार्क्स', // स्क्रीन का टाइटल
            headerShown: true, // इस स्क्रीन के लिए हेडर दिखाएं
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
