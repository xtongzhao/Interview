"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export interface InterviewQuestion {
  id: string;
  text: string;
  category: string;
  answered: boolean;
  answer?: string;
  startTime?: number;
  endTime?: number;
}

export interface InterviewSettings {
  duration: number; // in minutes
  interviewerTone: 'friendly' | 'professional' | 'strict';
  questionPace: 'slow' | 'moderate' | 'fast';
  followUpQuestions: boolean;
  timeLimitPerQuestion: number; // in seconds
}

export interface InterviewState {
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  isInterviewActive: boolean;
  isRecording: boolean;
  isPaused: boolean;
  startTime?: number;
  elapsedTime: number; // in seconds
  settings: InterviewSettings;
}

const DEFAULT_SETTINGS: InterviewSettings = {
  duration: 30,
  interviewerTone: 'professional',
  questionPace: 'moderate',
  followUpQuestions: true,
  timeLimitPerQuestion: 180, // 3 minutes
};

export function useInterview() {
  const [state, setState] = useState<InterviewState>({
    questions: [],
    currentQuestionIndex: 0,
    isInterviewActive: false,
    isRecording: false,
    isPaused: false,
    elapsedTime: 0,
    settings: DEFAULT_SETTINGS,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load saved interview state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('interview-state');
    const savedQuestions = localStorage.getItem('interview-questions');

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading interview state:', error);
      }
    }

    if (savedQuestions) {
      try {
        const questions = JSON.parse(savedQuestions);
        setState(prev => ({ ...prev, questions }));
      } catch (error) {
        console.error('Error loading interview questions:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (state.questions.length > 0 || state.isInterviewActive) {
      localStorage.setItem('interview-state', JSON.stringify({
        questions: state.questions,
        currentQuestionIndex: state.currentQuestionIndex,
        isInterviewActive: state.isInterviewActive,
        isRecording: state.isRecording,
        isPaused: state.isPaused,
        elapsedTime: state.elapsedTime,
        settings: state.settings,
      }));
    }
  }, [state]);

  // Timer logic
  useEffect(() => {
    if (state.isInterviewActive && !state.isPaused && startTimeRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setState(prev => ({ ...prev, elapsedTime: elapsed }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isInterviewActive, state.isPaused]);

  const loadQuestions = useCallback((questions: InterviewQuestion[]) => {
    setState(prev => ({
      ...prev,
      questions: questions.map(q => ({
        ...q,
        answered: false,
        answer: undefined,
        startTime: undefined,
        endTime: undefined,
      })),
    }));

    localStorage.setItem('interview-questions', JSON.stringify(questions));
  }, []);

  const startInterview = useCallback(() => {
    if (state.questions.length === 0) {
      alert('Please load questions first before starting the interview.');
      return;
    }

    startTimeRef.current = Date.now();
    setState(prev => ({
      ...prev,
      isInterviewActive: true,
      currentQuestionIndex: 0,
      elapsedTime: 0,
      questions: prev.questions.map((q, index) => ({
        ...q,
        answered: index === 0 ? false : q.answered,
        startTime: index === 0 ? Date.now() : q.startTime,
      })),
    }));
  }, [state.questions.length]);

  const pauseInterview = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeInterview = useCallback(() => {
    if (startTimeRef.current && state.isPaused) {
      // Adjust start time for the pause duration
      const pauseDuration = Date.now() - (startTimeRef.current + state.elapsedTime * 1000);
      startTimeRef.current += pauseDuration;
    }
    setState(prev => ({ ...prev, isPaused: false }));
  }, [state.isPaused, state.elapsedTime]);

  const stopInterview = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState(prev => ({
      ...prev,
      isInterviewActive: false,
      isRecording: false,
      isPaused: false,
    }));
    startTimeRef.current = null;
  }, []);

  const startRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: true }));
  }, []);

  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  const answerCurrentQuestion = useCallback((answer: string) => {
    setState(prev => {
      const updatedQuestions = [...prev.questions];
      if (prev.currentQuestionIndex < updatedQuestions.length) {
        updatedQuestions[prev.currentQuestionIndex] = {
          ...updatedQuestions[prev.currentQuestionIndex],
          answered: true,
          answer,
          endTime: Date.now(),
        };
      }

      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= prev.questions.length) {
        // Interview completed
        return {
          ...prev,
          isInterviewActive: false,
          isRecording: false,
          currentQuestionIndex: nextIndex - 1,
        };
      }

      const updatedQuestions = [...prev.questions];
      updatedQuestions[nextIndex] = {
        ...updatedQuestions[nextIndex],
        startTime: Date.now(),
      };

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        questions: updatedQuestions,
      };
    });
  }, []);

  const previousQuestion = useCallback(() => {
    setState(prev => {
      const prevIndex = Math.max(0, prev.currentQuestionIndex - 1);
      return {
        ...prev,
        currentQuestionIndex: prevIndex,
      };
    });
  }, []);

  const skipQuestion = useCallback(() => {
    setState(prev => {
      const updatedQuestions = [...prev.questions];
      if (prev.currentQuestionIndex < updatedQuestions.length) {
        updatedQuestions[prev.currentQuestionIndex] = {
          ...updatedQuestions[prev.currentQuestionIndex],
          answered: true,
          answer: '[Skipped]',
          endTime: Date.now(),
        };
      }

      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= updatedQuestions.length) {
        return {
          ...prev,
          questions: updatedQuestions,
          isInterviewActive: false,
          isRecording: false,
        };
      }

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        questions: updatedQuestions,
      };
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<InterviewSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const resetInterview = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    startTimeRef.current = null;
    setState({
      questions: [],
      currentQuestionIndex: 0,
      isInterviewActive: false,
      isRecording: false,
      isPaused: false,
      elapsedTime: 0,
      settings: DEFAULT_SETTINGS,
    });
    localStorage.removeItem('interview-state');
    localStorage.removeItem('interview-questions');
  }, []);

  // Calculate time left for current question
  const getCurrentQuestionTimeLeft = useCallback(() => {
    if (!state.isInterviewActive || state.currentQuestionIndex >= state.questions.length) {
      return state.settings.timeLimitPerQuestion;
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion.startTime) {
      return state.settings.timeLimitPerQuestion;
    }

    const elapsed = Math.floor((Date.now() - currentQuestion.startTime) / 1000);
    return Math.max(0, state.settings.timeLimitPerQuestion - elapsed);
  }, [state.isInterviewActive, state.currentQuestionIndex, state.questions, state.settings.timeLimitPerQuestion]);

  // Get current question
  const currentQuestion = state.questions[state.currentQuestionIndex] || null;

  // Get progress
  const progress = state.questions.length > 0
    ? (state.currentQuestionIndex + 1) / state.questions.length * 100
    : 0;

  // Calculate total interview time
  const totalTime = state.settings.duration * 60; // Convert to seconds
  const timeLeft = Math.max(0, totalTime - state.elapsedTime);

  return {
    // State
    state,
    currentQuestion,
    progress,
    timeLeft,
    questionTimeLeft: getCurrentQuestionTimeLeft(),

    // Actions
    loadQuestions,
    startInterview,
    pauseInterview,
    resumeInterview,
    stopInterview,
    startRecording,
    stopRecording,
    answerCurrentQuestion,
    nextQuestion,
    previousQuestion,
    skipQuestion,
    updateSettings,
    resetInterview,
  };
}