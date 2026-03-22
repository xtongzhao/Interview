"use client";

import { useState, useEffect, useCallback } from 'react';
import { Question, QuestionCategory, parseQuestionsFromText, categorizeQuestionsByType, filterQuestions, markAsFavorite, deleteQuestion } from '@/lib/questionsParser';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [importText, setImportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<QuestionCategory | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  // Load questions from localStorage on initial mount
  useEffect(() => {
    const savedQuestions = localStorage.getItem('interview-questions');
    if (savedQuestions) {
      try {
        const parsed = JSON.parse(savedQuestions);
        // Convert string dates back to Date objects
        const questionsWithDates = parsed.map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
        }));
        setQuestions(questionsWithDates);
      } catch (error) {
        console.error('Error loading questions from localStorage:', error);
      }
    }
  }, []);

  // Save questions to localStorage whenever they change
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem('interview-questions', JSON.stringify(questions));
    }
  }, [questions]);

  const handleImport = useCallback(() => {
    if (!importText.trim()) return;

    setIsLoading(true);
    try {
      const parsedQuestions = parseQuestionsFromText(importText);
      const newQuestions = parsedQuestions.map(q => ({
        ...q,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      setQuestions(prev => [...prev, ...newQuestions]);
      setImportText('');

      // Show success message
      alert(`Successfully imported ${newQuestions.length} questions.`);
    } catch (error) {
      console.error('Error importing questions:', error);
      alert('Error importing questions. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [importText]);

  const handleToggleFavorite = useCallback((questionId: string) => {
    setQuestions(prev => {
      const question = prev.find(q => q.id === questionId);
      if (!question) return prev;

      return markAsFavorite(prev, questionId, !question.isFavorite);
    });
  }, []);

  const handleDeleteQuestion = useCallback((questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => deleteQuestion(prev, questionId));
    }
  }, []);

  const handleClearAll = useCallback(() => {
    if (confirm('Are you sure you want to clear all questions? This action cannot be undone.')) {
      setQuestions([]);
      localStorage.removeItem('interview-questions');
    }
  }, []);

  const handleAddCustomQuestion = useCallback((text: string, category: QuestionCategory = 'general') => {
    const newQuestion: Question = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      isFavorite: false,
      tags: [],
      createdAt: new Date(),
    };

    setQuestions(prev => [...prev, newQuestion]);
  }, []);

  // Filter questions based on active filters
  const filteredQuestions = filterQuestions(questions, {
    category: activeCategory === 'all' ? undefined : activeCategory,
    searchText,
  });

  // Categorize questions for display
  const categorizedQuestions = categorizeQuestionsByType(questions);

  // Get favorite questions
  const favoriteQuestions = questions.filter(q => q.isFavorite);

  // Get category counts
  const categoryCounts = Object.entries(categorizedQuestions).reduce(
    (acc, [category, questions]) => ({
      ...acc,
      [category]: questions.length,
    }),
    {} as Record<QuestionCategory, number>
  );

  return {
    // State
    questions,
    importText,
    setImportText,
    isLoading,
    activeCategory,
    setActiveCategory,
    searchText,
    setSearchText,

    // Computed values
    filteredQuestions,
    categorizedQuestions,
    favoriteQuestions,
    categoryCounts,

    // Actions
    handleImport,
    handleToggleFavorite,
    handleDeleteQuestion,
    handleClearAll,
    handleAddCustomQuestion,
  };
}