// 面试资源处理管道 - RAG逻辑核心

import { InterviewResource, ResourceType, ResourceStatus } from './interviewModels';
import { KnowledgeCategory, classifyByKeywords } from './knowledgeCategories';
import { SimpleVectorStore, SimpleChunk } from './classifiedVectorStore';

// 导入PDF和Word解析功能
import { parseResume, categorizeResumeContent, CategorizedChunk as ResumeChunk } from './resumeParser';

// 注意：图片OCR需要额外依赖，这里提供接口和简单实现
// 实际项目中可以集成Tesseract.js或其他OCR服务

export interface ProcessResult {
  resource: InterviewResource;
  extractedText: string;
  chunks: SimpleChunk[];
  success: boolean;
  error?: string;
}

export class ResourceProcessor {
  private vectorStore: SimpleVectorStore;
  private ocrService: OCRService;

  constructor() {
    this.vectorStore = new SimpleVectorStore();
    this.ocrService = new APICallOCRService();
  }

  /**
   * 清理文本：去掉换行符，合并多个空格
   */
  private cleanText(text: string): string {
    return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * 处理面试资源（PDF、图片、文本等）
   */
  async processResource(resource: InterviewResource, file?: File): Promise<ProcessResult> {
    try {
      console.log(`Processing resource: ${resource.title} (${resource.type})`);

      // 更新状态为处理中
      resource.status = 'processing';
      resource.updatedAt = new Date();

      let extractedText = '';
      let chunks: SimpleChunk[] = [];

      // 根据资源类型调用不同的处理器
      switch (resource.type) {
        case 'resume':
        case 'jd':
          ({ extractedText, chunks } = await this.processDocument(resource, file));
          break;

        case 'image':
          ({ extractedText, chunks } = await this.processImage(resource, file));
          break;

        case 'text':
          ({ extractedText, chunks } = await this.processText(resource, file));
          break;

        default:
          throw new Error(`Unsupported resource type: ${resource.type}`);
      }

      // 保存提取的文本
      resource.content = extractedText;
      resource.status = 'processed';
      resource.processedAt = new Date();

      // 更新分类（基于内容重新分类）
      if (extractedText) {
        resource.category = classifyByKeywords(extractedText);
      }

      console.log(`Successfully processed resource ${resource.id}: extracted ${extractedText.length} chars, created ${chunks.length} chunks`);
      return {
        resource,
        extractedText,
        chunks,
        success: true,
      };

    } catch (error) {
      console.error(`Error processing resource ${resource.id}:`, error);
      resource.status = 'error';
      resource.updatedAt = new Date();

      return {
        resource,
        extractedText: '',
        chunks: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 处理文档（PDF、Word等）
   */
  private async processDocument(resource: InterviewResource, file?: File): Promise<{ extractedText: string; chunks: SimpleChunk[] }> {
    if (!file) {
      throw new Error('File is required for document processing');
    }

    // 使用现有的简历解析器
    const resumeData = await parseResume(file);
    const extractedText = this.cleanText(resumeData.rawText);

    // 将简历内容分类为知识块
    const resumeChunks = categorizeResumeContent(resumeData);

    // 转换为向量存储块
    const chunks: SimpleChunk[] = await Promise.all(
      resumeChunks.map(async (chunk) => {
        return this.vectorStore.storeContent(this.cleanText(chunk.text), {
          category: chunk.category,
          metadata: {
            source: 'resume',
            resourceId: resource.id,
            ...chunk.metadata,
          },
        });
      })
    );

    return { extractedText, chunks };
  }

  /**
   * 处理图片（小红书截图等）
   * 使用OCR服务提取文本
   */
  private async processImage(resource: InterviewResource, file?: File): Promise<{ extractedText: string; chunks: SimpleChunk[] }> {
    let extractedText = '';
    let ocrResult: OCRResult | null = null;

    // 如果有文件，尝试提取文本
    if (file) {
      // 检查文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        throw new Error('File is not an image');
      }

      try {
        // 调用OCR服务提取文本
        console.log(`开始OCR识别: ${file.name}`);
        ocrResult = await this.ocrService.extractText(file, {
          language: 'zh',
        });

        extractedText = this.cleanText(ocrResult.text);
        console.log(`OCR识别完成: ${extractedText.length}字符，置信度: ${ocrResult.confidence}`);

        // 存储图片的base64预览（用于显示）
        const base64Preview = await this.fileToBase64(file);
        resource.rawContent = base64Preview;

        // 记录OCR结果
        resource.metadata.ocrResult = {
          confidence: ocrResult.confidence,
          language: ocrResult.language,
          textBlocks: ocrResult.textBlocks,
        };

      } catch (error) {
        console.error('OCR识别失败:', error);
        // OCR失败时使用占位符
        extractedText = this.cleanText(`[图片OCR识别失败: ${file.name}]`);

        // 存储图片的base64预览
        const base64Preview = await this.fileToBase64(file);
        resource.rawContent = base64Preview;

        resource.metadata.ocrResult = {
          confidence: 0,
          language: 'zh',
          textBlocks: [],
        };
      }
    } else if (resource.rawContent && resource.rawContent.startsWith('data:image')) {
      // 如果已经有base64图片内容，但无法进行OCR（需要File对象）
      extractedText = this.cleanText(`[已有图片内容，但需要重新上传以进行OCR]`);
    }

    // 如果没有提取到有效文本，使用标题作为内容
    if (!extractedText || extractedText.includes('[图片') || extractedText.includes('[OCR placeholder') || extractedText.includes('[已有图片内容') || extractedText.trim().length < 10) {
      extractedText = this.cleanText(resource.title);
    }

    // 创建知识块
    const chunks: SimpleChunk[] = [];

    // 如果有OCR结果且文本较长，可以分割为多个块
    if (ocrResult && ocrResult.textBlocks.length > 0) {
      // 将每个文本块作为独立的知识块
      for (const block of ocrResult.textBlocks) {
        if (block.text.trim().length > 5) { // 忽略太短的文本块
          const chunk = await this.vectorStore.storeContent(block.text, {
            category: resource.category,
            metadata: {
              source: 'image',
              resourceId: resource.id,
              type: resource.type,
              fileName: resource.metadata.originalFilename,
              ocrConfidence: block.confidence,
            },
          });
          chunks.push(chunk);
        }
      }
    }

    // 如果没有创建任何块（或OCR结果为空），至少创建一个块
    if (chunks.length === 0) {
      const chunk = await this.vectorStore.storeContent(extractedText, {
        category: resource.category,
        metadata: {
          source: 'image',
          resourceId: resource.id,
          type: resource.type,
          fileName: resource.metadata.originalFilename,
        },
      });
      chunks.push(chunk);
    }

    return {
      extractedText,
      chunks,
    };
  }

  /**
   * 处理文本内容
   */
  private async processText(resource: InterviewResource, file?: File): Promise<{ extractedText: string; chunks: SimpleChunk[] }> {
    let extractedText = '';

    if (file) {
      // 读取文本文件
      extractedText = await file.text();
    } else if (resource.rawContent) {
      // 使用已有的原始内容
      extractedText = resource.rawContent;
    } else {
      // 使用标题作为内容
      extractedText = resource.title;
    }

    // 分割文本为段落，并清理每个段落内的换行符
    const paragraphs = extractedText
      .split(/\n\n+/)
      .map(p => this.cleanText(p.trim()))
      .filter(p => p.length > 0);

    // 如果没有段落（文本中没有双换行符），将整个清理后的文本作为一个段落
    if (paragraphs.length === 0) {
      paragraphs.push(this.cleanText(extractedText));
    }

    // 更新提取的文本为清理后的段落连接
    extractedText = paragraphs.join(' ');

    // 为每个段落创建知识块
    const chunks: SimpleChunk[] = [];
    for (const paragraph of paragraphs) {
      const category = classifyByKeywords(paragraph);
      const chunk = await this.vectorStore.storeContent(paragraph, {
        category,
        metadata: {
          source: 'text',
          resourceId: resource.id,
          type: resource.type,
        },
      });
      chunks.push(chunk);
    }

    // 如果没有段落，至少创建一个块
    if (chunks.length === 0 && extractedText.trim()) {
      const category = classifyByKeywords(extractedText);
      const chunk = await this.vectorStore.storeContent(extractedText, {
        category,
        metadata: {
          source: 'text',
          resourceId: resource.id,
          type: resource.type,
        },
      });
      chunks.push(chunk);
    }

    return { extractedText, chunks };
  }

  /**
   * 辅助方法：文件转base64
   * 兼容浏览器和Node.js环境
   */
  private async fileToBase64(file: File): Promise<string> {
    // 检查是否在浏览器环境
    if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
      // 浏览器环境：使用FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      // Node.js/服务器环境：使用Buffer
      try {
        // 首先尝试使用file.arrayBuffer()（现代API）
        if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const mimeType = file.type || 'application/octet-stream';
          return `data:${mimeType};base64,${base64}`;
        }

        // 备用方法：如果file有buffer属性
        if ((file as any).buffer) {
          const buffer = Buffer.from((file as any).buffer);
          const base64 = buffer.toString('base64');
          const mimeType = file.type || 'application/octet-stream';
          return `data:${mimeType};base64,${base64}`;
        }

        // 如果都没有，尝试其他方法
        console.warn('无法将文件转换为base64，使用回退方法');
        throw new Error('无法处理文件：缺少arrayBuffer方法');
      } catch (error) {
        console.error('文件转base64失败:', error);
        throw new Error(`文件转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  /**
   * 批量处理资源
   */
  async processResources(resources: InterviewResource[], files?: File[]): Promise<ProcessResult[]> {
    const results: ProcessResult[] = [];

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const file = files?.[i];
      const result = await this.processResource(resource, file);
      results.push(result);
    }

    return results;
  }

  /**
   * 从资源中检索相关知识
   */
  async retrieveKnowledgeFromResources(
    query: string,
    resourceTypes?: ResourceType[],
    limit: number = 5
  ): Promise<SimpleChunk[]> {
    // 使用向量存储检索
    const allChunks: SimpleChunk[] = [];

    // 获取所有知识块
    const allCategories = Object.values(KnowledgeCategory);
    for (const category of allCategories) {
      const chunks = await this.vectorStore.retrieveByCategory(category, query, {
        limit: Math.ceil(limit * 1.5), // 每个类别多取一些，以便过滤
        excludeMastered: false,
      });
      allChunks.push(...chunks);
    }

    // 去重（基于块ID）
    const uniqueChunks = allChunks.filter((chunk, index, self) =>
      index === self.findIndex(c => c.id === chunk.id)
    );

    // 过滤类型（如果指定）
    let filteredChunks = uniqueChunks;
    if (resourceTypes && resourceTypes.length > 0) {
      filteredChunks = uniqueChunks.filter(chunk => {
        const resourceType = chunk.metadata?.type as ResourceType;
        return resourceType && resourceTypes.includes(resourceType);
      });
    }

    // 返回前N个结果
    return filteredChunks.slice(0, limit);
  }

  /**
   * 获取资源统计信息
   */
  async getResourceStats(): Promise<{
    totalResources: number;
    byType: Record<ResourceType, number>;
    byCategory: Record<KnowledgeCategory, number>;
    byStatus: Record<ResourceStatus, number>;
  }> {
    // 注意：这里需要从InterviewStorage获取资源数据
    // 简化实现，返回空统计
    return {
      totalResources: 0,
      byType: {} as Record<ResourceType, number>,
      byCategory: {} as Record<KnowledgeCategory, number>,
      byStatus: {} as Record<ResourceStatus, number>,
    };
  }

  /**
   * 清除与资源相关的所有知识块
   */
  async clearResourceChunks(resourceId: string): Promise<number> {
    let deletedCount = 0;
    const allCategories = Object.values(KnowledgeCategory);

    for (const category of allCategories) {
      const collection = await this.vectorStore.getAllContents(category);
      const chunksToDelete = collection.filter(
        chunk => chunk.metadata?.resourceId === resourceId
      );

      for (const chunk of chunksToDelete) {
        const deleted = await this.vectorStore.deleteContent(chunk.id, category);
        if (deleted) deletedCount++;
      }
    }

    console.log(`Cleared ${deletedCount} chunks for resource ${resourceId}`);
    return deletedCount;
  }

  /**
   * 更新资源文本内容并重新生成知识块
   * @param resourceId 资源ID
   * @param newContent 新的文本内容
   * @param options 可选参数，包含资源类型和元数据
   * @returns 新创建的知识块数量
   */
  async updateResourceText(
    resourceId: string,
    newContent: string,
    options?: {
      resourceType?: ResourceType;
      metadata?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    chunks: SimpleChunk[];
    deletedCount: number;
    error?: string;
  }> {
    try {
      console.log(`Updating resource text for ${resourceId}`);

      // 1. 清除旧的资源块
      const deletedCount = await this.clearResourceChunks(resourceId);
      console.log(`Cleared ${deletedCount} old chunks for resource ${resourceId}`);

      // 2. 分割新内容并创建新块，清理换行符
      // 按段落分割（简单分割逻辑）
      const paragraphs = newContent
        .split(/\n\n+/)
        .map(p => this.cleanText(p.trim()))
        .filter(p => p.length > 0);

      // 如果没有段落，将整个清理后的内容作为一个段落
      const textSegments = paragraphs.length > 0 ? paragraphs : [this.cleanText(newContent)];

      // 3. 为每个段落创建知识块
      const chunks: SimpleChunk[] = [];
      for (const segment of textSegments) {
        const category = classifyByKeywords(segment);
        const chunk = await this.vectorStore.storeContent(segment, {
          category,
          metadata: {
            source: 'updated',
            resourceId: resourceId,
            type: options?.resourceType,
            ...(options?.metadata || {}),
          },
        });
        chunks.push(chunk);
      }

      console.log(`Created ${chunks.length} new chunks for resource ${resourceId}`);
      return {
        success: true,
        chunks,
        deletedCount,
      };

    } catch (error) {
      console.error(`Error updating resource text for ${resourceId}:`, error);
      return {
        success: false,
        chunks: [],
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ==================== OCR服务接口 ====================
// 实际OCR实现的占位符接口

export interface OCRService {
  extractText(imageFile: File, options?: OCROptions): Promise<OCRResult>;
}

export interface OCROptions {
  language?: string;
  rotate?: boolean;
  preprocess?: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  textBlocks: TextBlock[];
  processingTime: number;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 简单的OCR服务实现（实际项目中应集成Tesseract.js）
export class SimpleOCRService implements OCRService {
  async extractText(imageFile: File, options?: OCROptions): Promise<OCRResult> {
    // 这是一个占位符实现
    // 实际项目中应该：
    // 1. 使用Tesseract.js: import Tesseract from 'tesseract.js';
    // 2. 或者调用云端OCR API

    console.warn('SimpleOCRService is a placeholder. Implement real OCR integration.');

    return {
      text: `[OCR placeholder for: ${imageFile.name}]`,
      confidence: 0.1,
      language: options?.language || 'eng',
      textBlocks: [],
      processingTime: 0,
    };
  }
}

// API调用的OCR服务实现（调用我们的API路由）
export class APICallOCRService implements OCRService {
  private apiUrl = '/api/ocr';

  async extractText(imageFile: File, options?: OCROptions): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `OCR API请求失败: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'OCR处理失败');
      }

      return {
        text: result.result.text,
        confidence: result.result.confidence,
        language: result.result.language,
        textBlocks: result.result.textBlocks,
        processingTime: result.result.processingTime,
      };

    } catch (error) {
      console.error('APICallOCRService错误:', error);

      // 如果API调用失败，回退到简单OCR服务
      const simpleOCR = new SimpleOCRService();
      return simpleOCR.extractText(imageFile, options);
    }
  }
}

// 导出单例实例
export const resourceProcessor = new ResourceProcessor();