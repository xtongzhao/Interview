// 面试知识库扩展数据模型

import { KnowledgeCategory } from './knowledgeCategories';

// ==================== 招聘官网快捷链接 ====================
export interface RecruitmentWebsite {
  id: string;
  name: string; // 网站名称，如"BOSS直聘"、"拉勾网"
  url: string; // 网站URL
  description?: string; // 网站描述
  category: 'job_board' | 'company_portal' | 'social_media' | 'government' | 'other'; // 网站类型
  icon?: string; // 图标URL或emoji
  requiresLogin: boolean; // 是否需要登录
  popularity: number; // 热度/使用频率，用于排序
  tags: string[]; // 标签，如["互联网", "外企", "校招"]
  metadata: {
    lastVisited?: Date; // 最后访问时间
    visitCount: number; // 访问次数
    isFavorite: boolean; // 是否收藏
    note?: string; // 备注
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 面试资源类型 ====================
export type ResourceType = 'resume' | 'image' | 'text' | 'jd' | 'other';
export type ResourceStatus = 'pending' | 'processing' | 'processed' | 'error';

export interface InterviewResource {
  id: string;
  type: ResourceType;
  title: string;
  description?: string;
  file?: FileInfo;
  content?: string; // 解析后的文本内容
  rawContent?: string; // 原始内容（base64图片或原始文本）
  category: KnowledgeCategory;
  tags: string[];
  status: ResourceStatus;
  processedAt?: Date;
  metadata: {
    source?: string; // 来源：如"小红书"、"公司官网"等
    uploadDate: Date;
    originalFilename?: string;
    fileSize?: number;
    mimeType?: string;
    ocrResult?: {
      confidence: number;
      language?: string;
      textBlocks?: TextBlock[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface TextBlock {
  text: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

// ==================== 投递信息类型 ====================
export type ApplicationType = 'internship' | 'fulltime' | 'parttime' | 'contract';
export type ApplicationStatus = 'draft' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'accepted' | 'withdrawn';

export interface JobApplication {
  id: string;
  company: string;
  businessUnit?: string; // 业务部门/业务线
  position: string; // 职位名称
  location?: string; // 工作地点
  applicationType: ApplicationType; // 暑期/转正/全职等
  status: ApplicationStatus;
  jdContent?: string; // JD文本内容
  jdFile?: InterviewResource; // 关联的JD文件资源
  appliedDate: Date;
  updatedAt: Date;

  // 联系信息
  contactPerson?: string;
  contactEmail?: string;
  referral?: string;

  // 进度跟踪
  milestones: ApplicationMilestone[];
  notes: string;

  // 标签和分类
  tags: string[];
  priority: 'low' | 'medium' | 'high';

  metadata: {
    source?: string; // 投递来源：官网、内推、猎头等
    jobId?: string; // 公司内部的职位ID
    salaryExpectation?: string;
    isRemote?: boolean;
    careerPortalUrl?: string; // 公司招聘官网链接
  };

  // 关联的招聘网站
  recruitmentWebsiteId?: string;
}

export interface ApplicationMilestone {
  id: string;
  name: string;
  type: 'application' | 'resume_review' | 'phone_screen' | 'technical_interview' | 'onsite' | 'hr_interview' | 'offer' | 'other';
  date: Date;
  completed: boolean;
  notes?: string;
  interviewReviewId?: string; // 关联的面试复盘ID
}

// ==================== 面试复盘类型 ====================
export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral' | 'case';
export type InterviewOutcome = 'pending' | 'passed' | 'failed' | 'waitlisted';

export interface InterviewReview {
  id: string;
  jobApplicationId: string; // 关联的投递信息
  interviewType: InterviewType;
  interviewDate: Date;
  interviewers: string[]; // 面试官姓名
  duration?: number; // 面试时长（分钟）

  // 面试内容
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  notes: string;

  // 复盘总结
  selfEvaluation: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[]; // 需要改进的地方
    keyLearnings: string[]; // 关键收获
  };

  // 技术评估
  technicalSkills: {
    category: string;
    rating: 1 | 2 | 3 | 4 | 5; // 1-5分
    comments?: string;
  }[];

  outcome: InterviewOutcome;
  feedback?: string; // 面试官反馈

  // 关联资源
  relatedResources: string[]; // 关联的面试资源ID

  // 元数据
  metadata: {
    preparationTime?: number; // 准备时间（小时）
    followUpRequired?: boolean;
    followUpSent?: boolean;
    recordingAvailable?: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: KnowledgeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  askedBy?: string; // 哪位面试官问的
  timestamp?: number; // 在面试中的时间点（秒）
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
  selfRating: 1 | 2 | 3 | 4 | 5; // 自我评分
  interviewerReaction?: 'positive' | 'neutral' | 'negative'; // 面试官反应
  couldImprove?: string; // 可以改进的地方
  resourcesUsed?: string[]; // 使用的资源ID
}

// ==================== 存储管理 ====================
export class InterviewStorage {
  private static instance: InterviewStorage;

  // 本地存储键名
  private static readonly STORAGE_KEYS = {
    RESOURCES: 'interview_resources_v1',
    APPLICATIONS: 'job_applications_v1',
    REVIEWS: 'interview_reviews_v1',
    RECRUITMENT_WEBSITES: 'recruitment_websites_v1',
  };

  private constructor() {}

  static getInstance(): InterviewStorage {
    if (!InterviewStorage.instance) {
      InterviewStorage.instance = new InterviewStorage();
    }
    return InterviewStorage.instance;
  }

  // ========== 面试资源管理 ==========
  async saveResource(resource: InterviewResource): Promise<InterviewResource> {
    const resources = await this.getAllResources();
    const updatedResource = {
      ...resource,
      updatedAt: new Date(),
    };

    const index = resources.findIndex(r => r.id === resource.id);
    if (index >= 0) {
      resources[index] = updatedResource;
    } else {
      resources.push(updatedResource);
    }

    localStorage.setItem(InterviewStorage.STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    return updatedResource;
  }

  async deleteResource(resourceId: string): Promise<boolean> {
    const resources = await this.getAllResources();
    const filtered = resources.filter(r => r.id !== resourceId);

    if (filtered.length !== resources.length) {
      localStorage.setItem(InterviewStorage.STORAGE_KEYS.RESOURCES, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  async getResource(resourceId: string): Promise<InterviewResource | null> {
    const resources = await this.getAllResources();
    return resources.find(r => r.id === resourceId) || null;
  }

  async getAllResources(): Promise<InterviewResource[]> {
    try {
      const saved = localStorage.getItem(InterviewStorage.STORAGE_KEYS.RESOURCES);
      if (!saved) return [];

      const data = JSON.parse(saved);
      return data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        processedAt: item.processedAt ? new Date(item.processedAt) : undefined,
        metadata: {
          ...item.metadata,
          uploadDate: new Date(item.metadata?.uploadDate || item.createdAt),
        },
      }));
    } catch (error) {
      console.warn('Error loading resources from localStorage:', error);
      return [];
    }
  }

  async getResourcesByType(type: ResourceType): Promise<InterviewResource[]> {
    const resources = await this.getAllResources();
    return resources.filter(r => r.type === type);
  }

  // ========== 投递信息管理 ==========
  async saveApplication(application: JobApplication): Promise<JobApplication> {
    const applications = await this.getAllApplications();
    const updatedApp = {
      ...application,
      updatedAt: new Date(),
    };

    const index = applications.findIndex(a => a.id === application.id);
    if (index >= 0) {
      applications[index] = updatedApp;
    } else {
      applications.push(updatedApp);
    }

    localStorage.setItem(InterviewStorage.STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    return updatedApp;
  }

  async deleteApplication(applicationId: string): Promise<boolean> {
    const applications = await this.getAllApplications();
    const filtered = applications.filter(a => a.id !== applicationId);

    if (filtered.length !== applications.length) {
      localStorage.setItem(InterviewStorage.STORAGE_KEYS.APPLICATIONS, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  async getApplication(applicationId: string): Promise<JobApplication | null> {
    const applications = await this.getAllApplications();
    return applications.find(a => a.id === applicationId) || null;
  }

  async getAllApplications(): Promise<JobApplication[]> {
    try {
      const saved = localStorage.getItem(InterviewStorage.STORAGE_KEYS.APPLICATIONS);
      if (!saved) return [];

      const data = JSON.parse(saved);
      return data.map((item: any) => ({
        ...item,
        appliedDate: new Date(item.appliedDate),
        updatedAt: new Date(item.updatedAt),
        milestones: item.milestones?.map((milestone: any) => ({
          ...milestone,
          date: new Date(milestone.date),
        })) || [],
      }));
    } catch (error) {
      console.warn('Error loading applications from localStorage:', error);
      return [];
    }
  }

  async getApplicationsByStatus(status: ApplicationStatus): Promise<JobApplication[]> {
    const applications = await this.getAllApplications();
    return applications.filter(a => a.status === status);
  }

  // ========== 面试复盘管理 ==========
  async saveReview(review: InterviewReview): Promise<InterviewReview> {
    const reviews = await this.getAllReviews();
    const updatedReview = {
      ...review,
      updatedAt: new Date(),
    };

    const index = reviews.findIndex(r => r.id === review.id);
    if (index >= 0) {
      reviews[index] = updatedReview;
    } else {
      reviews.push(updatedReview);
    }

    localStorage.setItem(InterviewStorage.STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return updatedReview;
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    const reviews = await this.getAllReviews();
    const filtered = reviews.filter(r => r.id !== reviewId);

    if (filtered.length !== reviews.length) {
      localStorage.setItem(InterviewStorage.STORAGE_KEYS.REVIEWS, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  async getReview(reviewId: string): Promise<InterviewReview | null> {
    const reviews = await this.getAllReviews();
    return reviews.find(r => r.id === reviewId) || null;
  }

  async getAllReviews(): Promise<InterviewReview[]> {
    try {
      const saved = localStorage.getItem(InterviewStorage.STORAGE_KEYS.REVIEWS);
      if (!saved) return [];

      const data = JSON.parse(saved);
      return data.map((item: any) => ({
        ...item,
        interviewDate: new Date(item.interviewDate),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        questions: item.questions || [],
        answers: item.answers || [],
      }));
    } catch (error) {
      console.warn('Error loading reviews from localStorage:', error);
      return [];
    }
  }

  async getReviewsByApplication(applicationId: string): Promise<InterviewReview[]> {
    const reviews = await this.getAllReviews();
    return reviews.filter(r => r.jobApplicationId === applicationId);
  }

  // ========== 统计方法 ==========
  async getStats() {
    const [resources, applications, reviews] = await Promise.all([
      this.getAllResources(),
      this.getAllApplications(),
      this.getAllReviews(),
    ]);

    return {
      resources: {
        total: resources.length,
        byType: this.groupBy(resources, 'type'),
        byStatus: this.groupBy(resources, 'status'),
      },
      applications: {
        total: applications.length,
        byStatus: this.groupBy(applications, 'status'),
        byType: this.groupBy(applications, 'applicationType'),
      },
      reviews: {
        total: reviews.length,
        byOutcome: this.groupBy(reviews, 'outcome'),
        byType: this.groupBy(reviews, 'interviewType'),
      },
    };
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    const result: Record<string, number> = {};
    items.forEach(item => {
      const value = String(item[key]);
      result[value] = (result[value] || 0) + 1;
    });
    return result;
  }

  // ========== 搜索方法 ==========
  async searchResources(query: string): Promise<InterviewResource[]> {
    const resources = await this.getAllResources();
    const lowerQuery = query.toLowerCase();

    return resources.filter(resource =>
      resource.title.toLowerCase().includes(lowerQuery) ||
      resource.description?.toLowerCase().includes(lowerQuery) ||
      resource.content?.toLowerCase().includes(lowerQuery) ||
      resource.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async searchApplications(query: string): Promise<JobApplication[]> {
    const applications = await this.getAllApplications();
    const lowerQuery = query.toLowerCase();

    return applications.filter(app =>
      app.company.toLowerCase().includes(lowerQuery) ||
      app.position.toLowerCase().includes(lowerQuery) ||
      app.businessUnit?.toLowerCase().includes(lowerQuery) ||
      app.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // ========== 招聘官网管理 ==========
  async saveWebsite(website: RecruitmentWebsite): Promise<RecruitmentWebsite> {
    const websites = await this.getAllWebsites();
    const updatedWebsite = {
      ...website,
      updatedAt: new Date(),
    };

    const index = websites.findIndex(w => w.id === website.id);
    if (index >= 0) {
      websites[index] = updatedWebsite;
    } else {
      websites.push(updatedWebsite);
    }

    localStorage.setItem(InterviewStorage.STORAGE_KEYS.RECRUITMENT_WEBSITES, JSON.stringify(websites));
    return updatedWebsite;
  }

  async deleteWebsite(websiteId: string): Promise<boolean> {
    const websites = await this.getAllWebsites();
    const filtered = websites.filter(w => w.id !== websiteId);

    if (filtered.length !== websites.length) {
      localStorage.setItem(InterviewStorage.STORAGE_KEYS.RECRUITMENT_WEBSITES, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  async getWebsite(websiteId: string): Promise<RecruitmentWebsite | null> {
    const websites = await this.getAllWebsites();
    return websites.find(w => w.id === websiteId) || null;
  }

  async getAllWebsites(): Promise<RecruitmentWebsite[]> {
    try {
      const saved = localStorage.getItem(InterviewStorage.STORAGE_KEYS.RECRUITMENT_WEBSITES);
      if (!saved) return [];

      const data = JSON.parse(saved);
      return data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        metadata: {
          ...item.metadata,
          lastVisited: item.metadata?.lastVisited ? new Date(item.metadata.lastVisited) : undefined,
          visitCount: item.metadata?.visitCount || 0,
          isFavorite: item.metadata?.isFavorite || false,
        },
      }));
    } catch (error) {
      console.warn('Error loading recruitment websites from localStorage:', error);
      return [];
    }
  }

  async getWebsitesByCategory(category: RecruitmentWebsite['category']): Promise<RecruitmentWebsite[]> {
    const websites = await this.getAllWebsites();
    return websites.filter(w => w.category === category);
  }

  async searchWebsites(query: string): Promise<RecruitmentWebsite[]> {
    const websites = await this.getAllWebsites();
    const lowerQuery = query.toLowerCase();

    return websites.filter(website =>
      website.name.toLowerCase().includes(lowerQuery) ||
      website.description?.toLowerCase().includes(lowerQuery) ||
      website.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async incrementWebsiteVisitCount(websiteId: string): Promise<void> {
    const website = await this.getWebsite(websiteId);
    if (website) {
      const updatedWebsite: RecruitmentWebsite = {
        ...website,
        metadata: {
          ...website.metadata,
          lastVisited: new Date(),
          visitCount: (website.metadata.visitCount || 0) + 1,
        },
        updatedAt: new Date(),
      };
      await this.saveWebsite(updatedWebsite);
    }
  }

  async getPopularWebsites(limit: number = 10): Promise<RecruitmentWebsite[]> {
    const websites = await this.getAllWebsites();
    return websites
      .sort((a, b) => {
        // 先按是否收藏排序
        if (a.metadata.isFavorite && !b.metadata.isFavorite) return -1;
        if (!a.metadata.isFavorite && b.metadata.isFavorite) return 1;
        // 再按访问次数排序
        const aVisits = a.metadata.visitCount || 0;
        const bVisits = b.metadata.visitCount || 0;
        return bVisits - aVisits;
      })
      .slice(0, limit);
  }
}

// ==================== 辅助函数 ====================
export function generateId(prefix: string = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createNewResource(
  type: ResourceType,
  title: string,
  file?: File
): InterviewResource {
  const id = generateId('resource');

  const resource: InterviewResource = {
    id,
    type,
    title,
    description: '',
    category: KnowledgeCategory.RESUME, // 默认分类
    tags: [],
    status: 'pending',
    metadata: {
      uploadDate: new Date(),
      originalFilename: file?.name,
      fileSize: file?.size,
      mimeType: file?.type,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (file) {
    resource.file = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }

  return resource;
}

export function createNewApplication(
  company: string,
  position: string,
  applicationType: ApplicationType = 'fulltime'
): JobApplication {
  const id = generateId('app');

  return {
    id,
    company,
    position,
    applicationType,
    status: 'draft',
    appliedDate: new Date(),
    updatedAt: new Date(),
    milestones: [],
    notes: '',
    tags: [],
    priority: 'medium',
    metadata: {},
  };
}

export function createNewReview(
  jobApplicationId: string,
  interviewType: InterviewType = 'technical'
): InterviewReview {
  const id = generateId('review');

  return {
    id,
    jobApplicationId,
    interviewType,
    interviewDate: new Date(),
    interviewers: [],
    questions: [],
    answers: [],
    notes: '',
    selfEvaluation: {
      strengths: [],
      weaknesses: [],
      improvements: [],
      keyLearnings: [],
    },
    technicalSkills: [],
    outcome: 'pending',
    relatedResources: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createNewWebsite(
  name: string,
  url: string,
  category: RecruitmentWebsite['category'] = 'job_board',
  description?: string
): RecruitmentWebsite {
  const id = generateId('website');

  return {
    id,
    name,
    url,
    description,
    category,
    requiresLogin: true, // 大多数招聘网站需要登录
    popularity: 0,
    tags: [],
    metadata: {
      visitCount: 0,
      isFavorite: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function initializeDefaultRecruitmentWebsites(storage: InterviewStorage): Promise<void> {
  const existingWebsites = await storage.getAllWebsites();
  if (existingWebsites.length > 0) {
    return; // 已有数据，不重复初始化
  }

  const defaultWebsites: RecruitmentWebsite[] = [
    createNewWebsite('BOSS直聘', 'https://www.zhipin.com', 'job_board', '国内领先的互联网招聘平台，专注互联网行业'),
    createNewWebsite('拉勾网', 'https://www.lagou.com', 'job_board', '专注互联网职业机会的招聘网站'),
    createNewWebsite('猎聘', 'https://www.liepin.com', 'job_board', '高端人才招聘平台'),
    createNewWebsite('智联招聘', 'https://www.zhaopin.com', 'job_board', '综合性招聘网站'),
    createNewWebsite('前程无忧', 'https://www.51job.com', 'job_board', '国内领先的综合性招聘网站'),
    createNewWebsite('脉脉', 'https://maimai.cn', 'social_media', '职场社交平台，有招聘功能'),
    createNewWebsite('LinkedIn领英', 'https://www.linkedin.com', 'social_media', '全球职场社交平台'),
    createNewWebsite('实习僧', 'https://www.shixiseng.com', 'job_board', '专注实习和校招的招聘平台'),
    createNewWebsite('牛客网', 'https://www.nowcoder.com', 'job_board', '程序员笔试面试平台，有招聘功能'),
    createNewWebsite('阿里招聘官网', 'https://talent.alibaba.com', 'company_portal', '阿里巴巴集团官方招聘网站'),
    createNewWebsite('腾讯招聘官网', 'https://careers.tencent.com', 'company_portal', '腾讯官方招聘网站'),
    createNewWebsite('字节跳动招聘官网', 'https://jobs.bytedance.com', 'company_portal', '字节跳动官方招聘网站'),
    createNewWebsite('华为招聘官网', 'https://career.huawei.com', 'company_portal', '华为官方招聘网站'),
    createNewWebsite('百度招聘官网', 'https://talent.baidu.com', 'company_portal', '百度官方招聘网站'),
    createNewWebsite('美团招聘官网', 'https://zhaopin.meituan.com', 'company_portal', '美团官方招聘网站'),
    createNewWebsite('国家公务员局', 'http://www.scs.gov.cn', 'government', '国家公务员考试报名网站'),
  ];

  // 为部分网站设置特殊属性
  defaultWebsites[0].tags = ['互联网', '科技', '热门'];
  defaultWebsites[0].metadata.isFavorite = true;
  defaultWebsites[0].popularity = 100;

  defaultWebsites[1].tags = ['互联网', '科技'];
  defaultWebsites[1].popularity = 90;

  defaultWebsites[2].tags = ['高端', '外企', '管理'];
  defaultWebsites[2].popularity = 85;

  defaultWebsites[9].tags = ['大厂', '互联网', '电商'];
  defaultWebsites[9].metadata.isFavorite = true;

  // 批量保存
  for (const website of defaultWebsites) {
    await storage.saveWebsite(website);
  }
}