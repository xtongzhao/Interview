"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  InterviewResource,
  ResourceType,
  ResourceStatus,
  JobApplication,
  ApplicationStatus,
  ApplicationType,
  ApplicationMilestone,
  InterviewReview,
  InterviewType,
  InterviewOutcome,
  InterviewQuestion,
  InterviewStorage,
  generateId,
  createNewResource,
  createNewApplication,
  createNewReview,
} from '@/lib/interviewModels';
import { resourceProcessor, ProcessResult } from '@/lib/resourceProcessor';

export function useInterviewData() {
  const storage = InterviewStorage.getInstance();

  // ========== 状态管理 ==========
  const [resources, setResources] = useState<InterviewResource[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [reviews, setReviews] = useState<InterviewReview[]>([]);

  const [isLoading, setIsLoading] = useState({
    resources: true,
    applications: true,
    reviews: true,
  });

  const [processingResource, setProcessingResource] = useState<string | null>(null);

  // ========== 数据加载 ==========
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading({ resources: true, applications: true, reviews: true });

      const [loadedResources, loadedApplications, loadedReviews] = await Promise.all([
        storage.getAllResources(),
        storage.getAllApplications(),
        storage.getAllReviews(),
      ]);

      setResources(loadedResources);
      setApplications(loadedApplications);
      setReviews(loadedReviews);
    } catch (error) {
      console.error('Error loading interview data:', error);
    } finally {
      setIsLoading({ resources: false, applications: false, reviews: false });
    }
  };

  // ========== 面试资源管理 ==========
  const addResource = useCallback(async (
    type: ResourceType,
    title: string,
    file?: File,
    description?: string
  ): Promise<InterviewResource> => {
    const resource = createNewResource(type, title, file);
    if (description) {
      resource.description = description;
    }

    // 保存到存储
    const savedResource = await storage.saveResource(resource);
    setResources(prev => [...prev, savedResource]);

    // 异步处理资源内容
    if (file) {
      setProcessingResource(resource.id);
      try {
        const result = await resourceProcessor.processResource(savedResource, file);
        if (result.success && result.resource) {
          const updatedResource = await storage.saveResource(result.resource);
          setResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
        } else {
          console.warn('Resource processing failed:', result.error);
        }
      } catch (error) {
        console.error('Error processing resource:', error);
      } finally {
        setProcessingResource(null);
      }
    }

    return savedResource;
  }, [storage]);

  const updateResource = useCallback(async (resource: InterviewResource): Promise<void> => {
    const updated = await storage.saveResource(resource);
    setResources(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, [storage]);

  const deleteResource = useCallback(async (resourceId: string): Promise<boolean> => {
    const success = await storage.deleteResource(resourceId);
    if (success) {
      setResources(prev => prev.filter(r => r.id !== resourceId));
      // 同时清理相关的知识块
      await resourceProcessor.clearResourceChunks(resourceId);
    }
    return success;
  }, [storage]);

  const getResource = useCallback((resourceId: string): InterviewResource | undefined => {
    return resources.find(r => r.id === resourceId);
  }, [resources]);

  const getResourcesByType = useCallback((type: ResourceType): InterviewResource[] => {
    return resources.filter(r => r.type === type);
  }, [resources]);

  // ========== 投递信息管理 ==========
  const addApplication = useCallback(async (
    company: string,
    position: string,
    applicationType: ApplicationType = 'fulltime'
  ): Promise<JobApplication> => {
    const application = createNewApplication(company, position, applicationType);
    const savedApp = await storage.saveApplication(application);
    setApplications(prev => [...prev, savedApp]);
    return savedApp;
  }, [storage]);

  const updateApplication = useCallback(async (application: JobApplication): Promise<void> => {
    const updated = await storage.saveApplication(application);
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
  }, [storage]);

  const deleteApplication = useCallback(async (applicationId: string): Promise<boolean> => {
    const success = await storage.deleteApplication(applicationId);
    if (success) {
      setApplications(prev => prev.filter(a => a.id !== applicationId));
      // 同时删除相关的面试复盘
      const relatedReviews = reviews.filter(r => r.jobApplicationId === applicationId);
      for (const review of relatedReviews) {
        await storage.deleteReview(review.id);
      }
      setReviews(prev => prev.filter(r => r.jobApplicationId !== applicationId));
    }
    return success;
  }, [storage, reviews]);

  const getApplication = useCallback((applicationId: string): JobApplication | undefined => {
    return applications.find(a => a.id === applicationId);
  }, [applications]);

  const getApplicationsByStatus = useCallback((status: ApplicationStatus): JobApplication[] => {
    return applications.filter(a => a.status === status);
  }, [applications]);

  const addMilestone = useCallback(async (
    applicationId: string,
    milestone: Omit<ApplicationMilestone, 'id'>
  ): Promise<JobApplication | null> => {
    const application = getApplication(applicationId);
    if (!application) return null;

    const newMilestone: ApplicationMilestone = {
      ...milestone,
      id: generateId('milestone'),
    };

    const updatedApp: JobApplication = {
      ...application,
      milestones: [...application.milestones, newMilestone],
      updatedAt: new Date(),
    };

    await updateApplication(updatedApp);
    return updatedApp;
  }, [getApplication, updateApplication]);

  // ========== 面试复盘管理 ==========
  const addReview = useCallback(async (
    jobApplicationId: string,
    interviewType: InterviewType = 'technical'
  ): Promise<InterviewReview> => {
    const review = createNewReview(jobApplicationId, interviewType);
    const savedReview = await storage.saveReview(review);
    setReviews(prev => [...prev, savedReview]);
    return savedReview;
  }, [storage]);

  const updateReview = useCallback(async (review: InterviewReview): Promise<void> => {
    const updated = await storage.saveReview(review);
    setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, [storage]);

  const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
    const success = await storage.deleteReview(reviewId);
    if (success) {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    }
    return success;
  }, [storage]);

  const getReview = useCallback((reviewId: string): InterviewReview | undefined => {
    return reviews.find(r => r.id === reviewId);
  }, [reviews]);

  const getReviewsByApplication = useCallback((applicationId: string): InterviewReview[] => {
    return reviews.filter(r => r.jobApplicationId === applicationId);
  }, [reviews]);

  const addInterviewQuestion = useCallback(async (
    reviewId: string,
    question: string,
    category: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<InterviewReview | null> => {
    const review = getReview(reviewId);
    if (!review) return null;

    const newQuestion: InterviewQuestion = {
      id: generateId('question'),
      question,
      category: category as any, // 简化处理
      difficulty,
    };

    const updatedReview: InterviewReview = {
      ...review,
      questions: [...review.questions, newQuestion],
      updatedAt: new Date(),
    };

    await updateReview(updatedReview);
    return updatedReview;
  }, [getReview, updateReview]);

  // ========== 搜索功能 ==========
  const searchResources = useCallback(async (query: string): Promise<InterviewResource[]> => {
    return storage.searchResources(query);
  }, [storage]);

  const searchApplications = useCallback(async (query: string): Promise<JobApplication[]> => {
    return storage.searchApplications(query);
  }, [storage]);

  // ========== 统计功能 ==========
  const getStats = useCallback(async () => {
    return storage.getStats();
  }, [storage]);

  // ========== 批量操作 ==========
  const importResourcesFromFiles = useCallback(async (
    files: File[],
    type: ResourceType = 'text'
  ): Promise<ProcessResult[]> => {
    setIsLoading(prev => ({ ...prev, resources: true }));

    try {
      const resources: InterviewResource[] = files.map(file =>
        createNewResource(type, file.name, file)
      );

      // 批量处理
      const results = await resourceProcessor.processResources(resources, files);

      // 保存处理结果
      const savedResources: InterviewResource[] = [];
      for (const result of results) {
        if (result.success && result.resource) {
          const saved = await storage.saveResource(result.resource);
          savedResources.push(saved);
        }
      }

      setResources(prev => [...prev, ...savedResources]);
      return results;
    } finally {
      setIsLoading(prev => ({ ...prev, resources: false }));
    }
  }, [storage]);

  // ========== 导出数据 ==========
  const exportData = useCallback(async (): Promise<{
    resources: InterviewResource[];
    applications: JobApplication[];
    reviews: InterviewReview[];
  }> => {
    return {
      resources,
      applications,
      reviews,
    };
  }, [resources, applications, reviews]);

  return {
    // 状态
    resources,
    applications,
    reviews,
    isLoading,
    processingResource,

    // 资源管理
    addResource,
    updateResource,
    deleteResource,
    getResource,
    getResourcesByType,

    // 投递管理
    addApplication,
    updateApplication,
    deleteApplication,
    getApplication,
    getApplicationsByStatus,
    addMilestone,

    // 复盘管理
    addReview,
    updateReview,
    deleteReview,
    getReview,
    getReviewsByApplication,
    addInterviewQuestion,

    // 搜索和统计
    searchResources,
    searchApplications,
    getStats,

    // 批量操作
    importResourcesFromFiles,
    exportData,

    // 数据重载
    reloadData: loadAllData,
  };
}

// 为方便使用，导出类型别名
export type { InterviewResource, ResourceType, ResourceStatus };
export type { JobApplication, ApplicationStatus, ApplicationType };
export type { InterviewReview, InterviewType, InterviewOutcome };