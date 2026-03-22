"use client";

import { useState, useCallback, useEffect } from 'react';
import { SimpleVectorStore } from '@/lib/classifiedVectorStore';
import { categorizeResumeContent } from '@/lib/resumeParser';
import { KnowledgeCategory, CategoryConfig } from '@/lib/knowledgeCategories';

export interface GeneratedQuestion {
  id: string;
  text: string;
  category: 'general' | 'technical' | 'behavioral' | 'scenario' | 'product' | 'experience';
  difficulty: 'easy' | 'medium' | 'hard';
  isCustom?: boolean;
  relatedChunkId?: string;      // 关联的知识块ID（用于掌握度标记）
  relatedCategory?: string;     // 关联的分类（用于掌握度标记）
}

interface GenerationSettings {
  generalRatio: number;
  technicalRatio: number;
  behavioralRatio: number;
  includeResume: boolean;
  includeImported: boolean;
  randomizeOrder: boolean;
  position: string;
  industry: string;
}

export function useQuestionGeneration() {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>({
    generalRatio: 30,
    technicalRatio: 40,
    behavioralRatio: 30,
    includeResume: true,
    includeImported: true,
    randomizeOrder: false,
    position: '',
    industry: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [importedQuestions, setImportedQuestions] = useState<string[]>([]);

  // Load saved questions and settings from localStorage
  useEffect(() => {
    const savedQuestions = localStorage.getItem('generated-questions');
    const savedSettings = localStorage.getItem('question-generation-settings');

    if (savedQuestions) {
      try {
        setQuestions(JSON.parse(savedQuestions));
      } catch (error) {
        console.error('Error loading saved questions:', error);
      }
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }

    // Load resume text and imported questions from localStorage
    const savedResume = localStorage.getItem('resume-analysis');
    if (savedResume) {
      try {
        const resumeData = JSON.parse(savedResume);
        setResumeText(resumeData.rawText || '');

        // 将简历内容存储到分类向量库中
        (async () => {
          try {
            const vectorStore = new SimpleVectorStore();
            // 检查是否已经存储过（简单检查：如果向量库为空则存储）
            const stats = await vectorStore.getCategoryStats();
            const totalChunks = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);

            if (totalChunks === 0 && resumeData.rawText) {
              console.log('将简历内容存储到分类向量库...');

              // 使用简历解析器分类内容
              const chunks = categorizeResumeContent(resumeData);

              // 存储每个块
              for (const chunk of chunks) {
                await vectorStore.storeContent(chunk.text, {
                  category: chunk.category,
                  metadata: chunk.metadata,
                });
              }

              console.log(`已存储 ${chunks.length} 个简历知识块`);
            }
          } catch (storeError) {
            console.warn('存储简历内容到向量库失败:', storeError);
          }
        })();
      } catch (error) {
        console.error('Error loading resume:', error);
      }
    }

    const savedImported = localStorage.getItem('interview-questions');
    if (savedImported) {
      try {
        const importedData = JSON.parse(savedImported);
        setImportedQuestions(importedData.map((q: any) => q.text));
      } catch (error) {
        console.error('Error loading imported questions:', error);
      }
    }
  }, []);

  // Save questions and settings to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem('generated-questions', JSON.stringify(questions));
    }
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('question-generation-settings', JSON.stringify(settings));
  }, [settings]);

  const generateQuestions = useCallback(async () => {
    setIsGenerating(true);

    try {
      // 1. 确定重点类别
      const focusCategory = determineFocusCategory(settings);

      // 2. 从向量存储检索相关内容（排除已掌握的）
      let contextChunks: any[] = [];
      if (settings.includeResume) {
        try {
          const vectorStore = new SimpleVectorStore();
          const relevantChunks = await vectorStore.retrieveByCategory(
            focusCategory,
            `${settings.position || ''} ${settings.industry || ''}`.trim() || undefined,
            { excludeMastered: true, limit: 4 }
          );

          // 转换为API所需的格式
          contextChunks = relevantChunks.map(chunk => ({
            text: chunk.text,
            category: chunk.category,
            source: 'resume',
            chunkId: chunk.id, // 用于后续关联
          }));

          console.log(`检索到 ${contextChunks.length} 个相关内容用于生成问题`);
        } catch (retrieveError) {
          console.warn('检索相关内容失败，将使用传统方法:', retrieveError);
        }
      }

      // 3. 准备请求体
      const requestBody = {
        questionTypes: {
          general: settings.generalRatio,
          technical: settings.technicalRatio,
          behavioral: settings.behavioralRatio,
        },
        resumeText: settings.includeResume && contextChunks.length === 0 ? resumeText : undefined,
        importedQuestions: settings.includeImported ? importedQuestions : undefined,
        position: settings.position || undefined,
        industry: settings.industry || undefined,
        contextChunks: contextChunks.length > 0 ? contextChunks : undefined,
      };

      // 4. 调用API生成问题
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.questions) {
        // 5. 映射API响应到我们的问题格式，并关联上下文
        const newQuestions: (GeneratedQuestion & { relatedChunkId?: string; relatedCategory?: string })[] = data.questions.map((q: any, index: number) => {
          // 尝试将问题与检索到的上下文关联（简单轮询分配）
          const relatedChunk = contextChunks[index % contextChunks.length];

          return {
            id: `gen-${Date.now()}-${index}`,
            text: q.text || q.question || '',
            category: mapCategory(q.category?.toLowerCase() || 'general'),
            difficulty: q.difficulty?.toLowerCase() || 'medium',
            isCustom: false,
            relatedChunkId: relatedChunk?.chunkId,
            relatedCategory: relatedChunk?.category,
          };
        });

        // 应用随机排序（如果启用）
        let finalQuestions = newQuestions;
        if (settings.randomizeOrder) {
          finalQuestions = [...newQuestions].sort(() => Math.random() - 0.5);
        }

        setQuestions(finalQuestions);
        return finalQuestions;
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);

      // 降级方案：API失败时生成示例问题
      const sampleQuestions: GeneratedQuestion[] = [
        {
          id: `sample-${Date.now()}-1`,
          text: "Based on your experience, how would you approach designing a RAG system for customer support?",
          category: 'experience',
          difficulty: 'medium',
        },
        {
          id: `sample-${Date.now()}-2`,
          text: "What are the key differences between fine-tuning and prompt engineering for AI product development?",
          category: 'technical',
          difficulty: 'hard',
        },
        {
          id: `sample-${Date.now()}-3`,
          text: "Describe a time when you had to prioritize between model accuracy and inference speed.",
          category: 'behavioral',
          difficulty: 'medium',
        },
        {
          id: `sample-${Date.now()}-4`,
          text: "How would you design an evaluation framework for prompt effectiveness?",
          category: 'scenario',
          difficulty: 'hard',
        },
        {
          id: `sample-${Date.now()}-5`,
          text: "What metrics would you track for an AI-powered feature in a consumer app?",
          category: 'product',
          difficulty: 'medium',
        },
      ];

      setQuestions(sampleQuestions);
      return sampleQuestions;
    } finally {
      setIsGenerating(false);
    }
  }, [settings, resumeText, importedQuestions]);

  // 辅助函数：确定重点类别
  function determineFocusCategory(settings: GenerationSettings): KnowledgeCategory {
    // 基于问题类型比例决定
    if (settings.technicalRatio > 50) {
      return KnowledgeCategory.LLM_KNOWLEDGE;
    }
    if (settings.behavioralRatio > 50) {
      return KnowledgeCategory.SCENARIO;
    }
    if (settings.position?.includes('产品') || settings.position?.includes('经理')) {
      return KnowledgeCategory.CREATIVE_THINKING;
    }
    return KnowledgeCategory.RESUME;
  }

  const addCustomQuestion = useCallback((text: string, category: GeneratedQuestion['category'] = 'general') => {
    const newQuestion: GeneratedQuestion = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      difficulty: 'medium',
      isCustom: true,
    };

    setQuestions(prev => [...prev, newQuestion]);
  }, []);

  const editQuestion = useCallback((questionId: string, updates: Partial<GeneratedQuestion>) => {
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ));
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  const regenerateQuestion = useCallback(async (questionId: string) => {
    // For now, just delete and generate a new one
    deleteQuestion(questionId);
    const newQuestions = await generateQuestions();
    return newQuestions[0]; // Return first new question
  }, [deleteQuestion, generateQuestions]);

  const updateSettings = useCallback((newSettings: Partial<GenerationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const exportQuestions = useCallback(() => {
    const data = {
      generatedAt: new Date().toISOString(),
      settings,
      questions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-questions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [questions, settings]);

  // Helper function to map API categories to our categories
  const mapCategory = (category: string): GeneratedQuestion['category'] => {
    const categoryMap: Record<string, GeneratedQuestion['category']> = {
      'general': 'general',
      'technical': 'technical',
      'behavioral': 'behavioral',
      'scenario': 'scenario',
      'product': 'product',
      'experience': 'experience',
      'ai-product': 'product',
      'rag-design': 'technical',
      'prompt-engineering': 'technical',
      'system-design': 'technical',
    };

    return categoryMap[category] || 'general';
  };

  // Get questions by category
  const questionsByCategory = questions.reduce(
    (acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
    },
    {} as Record<GeneratedQuestion['category'], GeneratedQuestion[]>
  );

  return {
    // State
    questions,
    settings,
    isGenerating,

    // Computed values
    questionsByCategory,

    // Actions
    generateQuestions,
    addCustomQuestion,
    editQuestion,
    deleteQuestion,
    regenerateQuestion,
    updateSettings,
    exportQuestions,
  };
}