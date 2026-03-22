"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { SimpleVectorStore } from '@/lib/classifiedVectorStore';
import { KnowledgeCategory } from '@/lib/knowledgeCategories';

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
  dynamicQuestions: boolean; // 是否启用动态问题生成（基于回答生成新问题）
  timeLimitPerQuestion: number; // in seconds
  prompt: string; // 系统提示词，定义面试官性格喜好和追问要求
  jobDescription: string; // 岗位JD描述
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
  dynamicQuestions: true, // 默认启用动态问题生成
  timeLimitPerQuestion: 180, // 3 minutes
  prompt: '你是一位专业的面试官，善于挖掘候选人的潜力和技术深度。请根据候选人的背景提出有针对性的问题，并适时进行追问。',
  jobDescription: '',
};

const SAMPLE_QUESTIONS: InterviewQuestion[] = [
  { id: '1', text: "Tell me about yourself and your experience with AI product management.", category: 'general', answered: false },
  { id: '2', text: "How would you design a RAG system for a knowledge base application?", category: 'technical', answered: false },
  { id: '3', text: "What metrics would you track for a prompt engineering platform?", category: 'product', answered: false },
  { id: '4', text: "Describe a time when you had to convince stakeholders about a technical decision.", category: 'behavioral', answered: false },
  { id: '5', text: "How do you approach ethical considerations in AI product development?", category: 'scenario', answered: false },
];

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

  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

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

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      setVideoStream(stream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Silently fail - camera is not required for interview
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  }, [videoStream]);

  // 从知识库生成面试问题（基于RAG和岗位JD匹配）
  const generateQuestionsFromKnowledgeBase = useCallback(async () => {
    try {
      console.log('从知识库生成面试问题...');
      console.log('岗位JD:', state.settings.jobDescription);
      console.log('提示词:', state.settings.prompt);

      const vectorStore = new SimpleVectorStore();

      // 1. 从所有分类获取内容
      const allContents = await vectorStore.getAllContents();
      console.log(`知识库中共有 ${allContents.length} 个知识块`);

      if (allContents.length === 0) {
        console.warn('知识库为空，无法生成问题');
        return [];
      }

      // 2. 根据岗位JD计算每个知识块的相关性分数
      const scoredContents = allContents.map(chunk => {
        let score = 0;

        // 如果有岗位JD，计算相关性
        if (state.settings.jobDescription.trim()) {
          // 简单相关性计算：基于共同关键词
          const jdWords = new Set(state.settings.jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 2));
          const chunkWords = new Set(chunk.text.toLowerCase().split(/\W+/).filter(w => w.length > 2));

          if (jdWords.size > 0 && chunkWords.size > 0) {
            const intersection = new Set([...jdWords].filter(x => chunkWords.has(x)));
            score = intersection.size / jdWords.size;
          }
        } else {
          // 没有JD时，给所有内容基础分数
          score = 0.1;
        }

        // 排除已掌握的内容（降低其优先级）
        if (chunk.isMastered) {
          score *= 0.3;
        }

        return { chunk, score };
      });

      // 3. 按相关性排序
      scoredContents.sort((a, b) => b.score - a.score);

      // 4. 选择最相关的5-10个知识块
      const topChunks = scoredContents
        .filter(item => item.score > 0.01) // 过滤掉完全不相关的内容
        .slice(0, 10)
        .map(item => item.chunk);

      console.log(`选择了 ${topChunks.length} 个最相关的知识块`);

      if (topChunks.length === 0) {
        console.warn('没有找到相关的内容，使用示例问题');
        return [];
      }

      // 5. 准备API请求
      const requestBody = {
        contextChunks: topChunks.map(chunk => ({
          text: chunk.text,
          category: chunk.category,
          source: 'knowledge_base',
          chunkId: chunk.id,
        })),
        prompt: state.settings.prompt,
        jobDescription: state.settings.jobDescription,
        // 问题类型分布（基于岗位JD和提示词动态调整）
        questionTypes: {
          general: 30,
          technical: 40,
          behavioral: 30,
        },
        position: state.settings.jobDescription.includes('产品') ? 'AI产品经理' : '技术岗位',
        industry: '科技',
      };

      // 6. 调用API生成问题
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.questions) {
        // 7. 将API响应转换为InterviewQuestion格式
        const newQuestions: InterviewQuestion[] = data.questions.map((q: any, index: number) => ({
          id: `kb-${Date.now()}-${index}`,
          text: q.text || q.question || '',
          category: q.category || 'general',
          answered: false,
          answer: undefined,
          startTime: undefined,
          endTime: undefined,
        }));

        console.log(`成功生成 ${newQuestions.length} 个问题`);
        return newQuestions;
      } else {
        throw new Error(data.error || '生成问题失败');
      }
    } catch (error) {
      console.error('从知识库生成问题失败:', error);

      // 降级方案：使用示例问题
      const fallbackQuestions = SAMPLE_QUESTIONS.map(q => ({
        ...q,
        answered: false,
        answer: undefined,
        startTime: undefined,
        endTime: undefined,
      }));

      console.log('使用示例问题作为备选');
      return fallbackQuestions;
    }
  }, [state.settings.jobDescription, state.settings.prompt]);

  // 生成跟进问题（基于当前问题、回答和上下文）
  const generateFollowupQuestion = useCallback(async (currentQuestion: InterviewQuestion, userAnswer: string) => {
    try {
      console.log('生成跟进问题...');
      console.log('当前问题:', currentQuestion.text);
      console.log('用户回答:', userAnswer.substring(0, 100) + '...');

      // 获取知识库相关内容
      const vectorStore = new SimpleVectorStore();
      const allContents = await vectorStore.getAllContents();

      // 选择最相关的知识块 - 改进版
      const relevantChunks = allContents
        .map(chunk => {
          // 计算问题和回答与知识块的相关性分数
          const questionText = currentQuestion.text.toLowerCase();
          const answerText = userAnswer.toLowerCase();
          const chunkText = chunk.text.toLowerCase();

          // 提取关键词（长度>3的单词）
          const extractKeywords = (text: string): string[] => {
            return text.split(/\W+/).filter(word => word.length > 3);
          };

          const questionKeywords = extractKeywords(questionText);
          const answerKeywords = extractKeywords(answerText);
          const chunkKeywords = extractKeywords(chunkText);

          // 计算匹配的关键词数量
          let score = 0;
          questionKeywords.forEach(keyword => {
            if (chunkText.includes(keyword)) score += 2; // 问题关键词匹配权重更高
          });
          answerKeywords.forEach(keyword => {
            if (chunkText.includes(keyword)) score += 1; // 回答关键词匹配权重稍低
          });

          // 检查知识块关键词是否出现在问题或回答中
          chunkKeywords.forEach(keyword => {
            if (questionText.includes(keyword) || answerText.includes(keyword)) score += 1;
          });

          return { chunk, score };
        })
        .filter(item => item.score > 0) // 只保留有相关性的块
        .sort((a, b) => b.score - a.score) // 按分数降序排序
        .slice(0, 5) // 最多5个最相关的块
        .map(item => item.chunk);

      // 准备API请求
      const requestBody = {
        currentQuestion: currentQuestion.text,
        userAnswer: userAnswer,
        prompt: state.settings.prompt,
        jobDescription: state.settings.jobDescription,
        contextChunks: relevantChunks.map(chunk => ({
          text: chunk.text,
          category: chunk.category,
          source: 'knowledge_base',
          chunkId: chunk.id,
        })),
        // 指示这是跟进问题
        isFollowup: true,
      };

      // 调用API生成跟进问题
      const response = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.followupQuestion) {
        const followupQuestion: InterviewQuestion = {
          id: `followup-${Date.now()}`,
          text: data.followupQuestion.text || data.followupQuestion,
          category: currentQuestion.category, // 保持相同类别
          answered: false,
          answer: undefined,
          startTime: undefined,
          endTime: undefined,
        };

        console.log('成功生成跟进问题:', followupQuestion.text);
        return followupQuestion;
      } else {
        throw new Error(data.error || '生成跟进问题失败');
      }
    } catch (error) {
      console.error('生成跟进问题失败:', error);
      // 返回null表示失败
      return null;
    }
  }, [state.settings.jobDescription, state.settings.prompt]);

  // 生成动态问题（基于对话历史和上下文）
  const generateDynamicQuestion = useCallback(async (conversationHistory: {question: string, answer: string}[]) => {
    try {
      console.log('生成动态问题...');
      console.log('对话历史长度:', conversationHistory.length);

      if (conversationHistory.length === 0) {
        // 如果没有历史，则生成一个初始问题
        return null;
      }

      // 获取知识库相关内容
      const vectorStore = new SimpleVectorStore();
      const allContents = await vectorStore.getAllContents();

      // 使用最近的回答作为查询上下文
      const recentAnswer = conversationHistory[conversationHistory.length - 1].answer;
      const recentQuestion = conversationHistory[conversationHistory.length - 1].question;

      // 选择最相关的知识块（类似于跟进问题但更注重回答）
      const relevantChunks = allContents
        .map(chunk => {
          // 计算相关性分数
          const answerText = recentAnswer.toLowerCase();
          const chunkText = chunk.text.toLowerCase();

          // 提取关键词（长度>3的单词）
          const extractKeywords = (text: string): string[] => {
            return text.split(/\W+/).filter(word => word.length > 3);
          };

          const answerKeywords = extractKeywords(answerText);
          const chunkKeywords = extractKeywords(chunkText);

          // 计算匹配的关键词数量
          let score = 0;
          answerKeywords.forEach(keyword => {
            if (chunkText.includes(keyword)) score += 2;
          });
          chunkKeywords.forEach(keyword => {
            if (answerText.includes(keyword)) score += 1;
          });

          return { chunk, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.chunk);

      // 准备API请求
      const requestBody = {
        currentQuestion: recentQuestion,
        userAnswer: recentAnswer,
        prompt: state.settings.prompt,
        jobDescription: state.settings.jobDescription,
        contextChunks: relevantChunks.map(chunk => ({
          text: chunk.text,
          category: chunk.category,
          source: 'knowledge_base',
          chunkId: chunk.id,
        })),
        // 指示这是动态生成的新问题（不是跟进问题）
        isFollowup: false,
        isDynamic: true,
        conversationHistory: conversationHistory.slice(-3), // 最近3个问答对
      };

      // 调用API生成动态问题（使用同一个端点，但通过isDynamic标志区分）
      const response = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.followupQuestion) {
        const dynamicQuestion: InterviewQuestion = {
          id: `dynamic-${Date.now()}`,
          text: data.followupQuestion.text || data.followupQuestion,
          category: data.followupQuestion.category || 'general',
          answered: false,
          answer: undefined,
          startTime: undefined,
          endTime: undefined,
        };

        console.log('成功生成动态问题:', dynamicQuestion.text);
        return dynamicQuestion;
      } else {
        throw new Error(data.error || '生成动态问题失败');
      }
    } catch (error) {
      console.error('生成动态问题失败:', error);
      return null;
    }
  }, [state.settings.jobDescription, state.settings.prompt]);

  const startInterview = useCallback(async () => {
    try {
      let finalQuestions = state.questions;

      // 如果还没有问题，尝试从知识库生成
      if (state.questions.length === 0 && state.settings.jobDescription.trim()) {
        console.log('尝试从知识库生成面试问题...');
        const generatedQuestions = await generateQuestionsFromKnowledgeBase();

        if (generatedQuestions.length > 0) {
          finalQuestions = generatedQuestions;
          // 保存生成的问题到本地存储
          localStorage.setItem('interview-questions', JSON.stringify(generatedQuestions));
          console.log(`已加载 ${generatedQuestions.length} 个从知识库生成的问题`);
        }
      }

      startTimeRef.current = Date.now();
      setState(prev => {
        // If no questions loaded, use sample questions
        let questions = finalQuestions.length > 0 ? finalQuestions : prev.questions;
        if (questions.length === 0) {
          questions = SAMPLE_QUESTIONS.map(q => ({
            ...q,
            answered: false,
            answer: undefined,
            startTime: undefined,
            endTime: undefined,
          }));
          // Save sample questions to localStorage
          localStorage.setItem('interview-questions', JSON.stringify(SAMPLE_QUESTIONS));
        }

        // Start interview with questions
        return {
          ...prev,
          questions: questions.map((q, index) => ({
            ...q,
            answered: index === 0 ? false : q.answered,
            startTime: index === 0 ? Date.now() : q.startTime,
          })),
          isInterviewActive: true,
          currentQuestionIndex: 0,
          elapsedTime: 0,
        };
      });
      // Start camera for video feed
      startCamera();
    } catch (error) {
      console.error('启动面试失败:', error);
      // 回退到原逻辑
      startTimeRef.current = Date.now();
      setState(prev => {
        let questions = prev.questions;
        if (questions.length === 0) {
          questions = SAMPLE_QUESTIONS.map(q => ({
            ...q,
            answered: false,
            answer: undefined,
            startTime: undefined,
            endTime: undefined,
          }));
          localStorage.setItem('interview-questions', JSON.stringify(SAMPLE_QUESTIONS));
        }

        return {
          ...prev,
          questions: questions.map((q, index) => ({
            ...q,
            answered: index === 0 ? false : q.answered,
            startTime: index === 0 ? Date.now() : q.startTime,
          })),
          isInterviewActive: true,
          currentQuestionIndex: 0,
          elapsedTime: 0,
        };
      });
      startCamera();
    }
  }, [startCamera, state.questions, state.settings.jobDescription, generateQuestionsFromKnowledgeBase]);

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
    // Stop camera
    stopCamera();
  }, [stopCamera]);

  const startRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: true }));
  }, []);

  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  const answerCurrentQuestion = useCallback(async (answer: string, generateFollowup: boolean = true) => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion) return;

    // 更新当前问题的答案
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

    // 异步生成后续问题（如果启用）
    if (generateFollowup && answer.trim().length > 10) { // 只有回答有一定长度时才生成
      try {
        // 收集对话历史（所有已回答的问题和回答），包括当前刚回答的问题
        const conversationHistory = [
          // 已回答的历史问题（不包括当前问题，因为它的answered标志可能还没更新）
          ...state.questions
            .filter((q, idx) => q.answered && idx < state.currentQuestionIndex)
            .map(q => ({
              question: q.text,
              answer: q.answer || '',
            })),
          // 当前刚回答的问题
          {
            question: currentQuestion.text,
            answer: answer,
          }
        ];

        console.log(`对话历史长度: ${conversationHistory.length}`);

        let newQuestion: InterviewQuestion | null = null;

        // 决定生成哪种类型的问题
        const shouldGenerateDynamic = state.settings.dynamicQuestions && answer.trim().length > 30;

        if (shouldGenerateDynamic && Math.random() > 0.5) {
          // 50%概率生成动态问题
          console.log('尝试生成动态问题...');
          newQuestion = await generateDynamicQuestion(conversationHistory);
          if (newQuestion) {
            console.log('动态问题生成成功');
          } else {
            console.log('动态问题生成失败，回退到跟进问题');
            newQuestion = await generateFollowupQuestion(currentQuestion, answer);
          }
        } else {
          // 生成跟进问题
          console.log('生成跟进问题...');
          newQuestion = await generateFollowupQuestion(currentQuestion, answer);
        }

        if (newQuestion) {
          // 将新问题插入到当前问题之后
          setState(prev => {
            const updatedQuestions = [...prev.questions];
            const insertIndex = prev.currentQuestionIndex + 1;

            // 为新问题添加开始时间
            const questionWithStartTime = {
              ...newQuestion!,
              startTime: Date.now(),
            };

            // 插入新问题
            updatedQuestions.splice(insertIndex, 0, questionWithStartTime);

            console.log(`新问题已添加到位置 ${insertIndex + 1}: ${newQuestion!.text.substring(0, 50)}...`);
            console.log(`自动跳转到新问题 (索引: ${insertIndex})`);

            return {
              ...prev,
              questions: updatedQuestions,
              currentQuestionIndex: insertIndex, // 自动跳转到新问题
            };
          });
        }
      } catch (error) {
        console.error('生成后续问题时出错:', error);
        // 静默失败，不影响用户体验
      }
    }
  }, [state.questions, state.currentQuestionIndex, state.settings.dynamicQuestions, generateFollowupQuestion, generateDynamicQuestion]);

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
    // Stop camera if active
    stopCamera();
  }, [stopCamera]);

  // 下载问题为Markdown格式
  const downloadQuestionsAsMarkdown = useCallback(() => {
    if (state.questions.length === 0) {
      alert('没有可下载的问题。请先生成或加载问题。');
      return;
    }

    // 创建Markdown内容
    let markdownContent = `# 面试问题清单\n\n`;
    markdownContent += `生成时间: ${new Date().toLocaleString()}\n`;
    markdownContent += `问题总数: ${state.questions.length}\n`;
    markdownContent += `岗位JD: ${state.settings.jobDescription || '未设置'}\n\n`;

    // 添加每个问题
    state.questions.forEach((question, index) => {
      markdownContent += `## 问题 ${index + 1}\n\n`;
      markdownContent += `**类别**: ${question.category}\n\n`;
      markdownContent += `**问题**: ${question.text}\n\n`;

      if (question.answered) {
        markdownContent += `**回答**: ${question.answer || '暂无回答'}\n\n`;
        markdownContent += `**回答状态**: 已回答\n\n`;
      } else {
        markdownContent += `**回答状态**: 未回答\n\n`;
      }

      markdownContent += `---\n\n`;
    });

    // 添加统计信息
    const answeredCount = state.questions.filter(q => q.answered).length;
    markdownContent += `## 统计信息\n\n`;
    markdownContent += `- 已回答: ${answeredCount} / ${state.questions.length}\n`;
    markdownContent += `- 未回答: ${state.questions.length - answeredCount} / ${state.questions.length}\n`;

    // 创建下载
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `面试问题_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.questions, state.settings.jobDescription]);

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

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

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
    videoStream,
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
    generateQuestionsFromKnowledgeBase,
    downloadQuestionsAsMarkdown,
    generateFollowupQuestion,
    generateDynamicQuestion,
  };
}