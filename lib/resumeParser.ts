// PDF和Word解析库将在需要时动态导入以减小包大小
// 注意：这些库只能在客户端使用

export interface ResumeData {
  rawText: string;
  sections: {
    personalInfo?: string[];
    education?: string[];
    experience?: string[];
    projects?: string[];
    skills?: string[];
    certifications?: string[];
  };
  extractedInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
}

export async function parseResume(file: File): Promise<ResumeData> {
  // 确保只在客户端运行
  if (typeof window === 'undefined') {
    throw new Error('parseResume can only be called on the client side');
  }

  const fileType = file.type;
  const buffer = await file.arrayBuffer();

  let text = '';

  if (fileType === 'application/pdf') {
    try {
      // 动态导入pdf-parse库（仅在需要时加载）
      // 注意：pdf-parse v2.4.5使用PDFParse类而不是默认导出
      const pdfParseModule = await import('pdf-parse');

      // 处理不同的导出方式：可能导出PDFParse类，也可能有其他导出结构
      let PDFParse;
      if (pdfParseModule.PDFParse) {
        PDFParse = pdfParseModule.PDFParse;
      // @ts-ignore
      } else if (pdfParseModule.default && pdfParseModule.default.PDFParse) {
        // @ts-ignore
        PDFParse = pdfParseModule.default.PDFParse;
      // @ts-ignore
      } else if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
        // 向后兼容：如果默认导出是函数，使用旧的API
        // @ts-ignore
        const pdfParseFn = pdfParseModule.default;
        const pdfData = await pdfParseFn(new Uint8Array(buffer));
        text = pdfData.text;
        return extractResumeInfo(text);
      } else {
        throw new Error('PDFParse class not found in pdf-parse module');
      }

      // 在浏览器环境中设置PDF.js worker源（避免"No GlobalWorkerOptions.workerSrc specified"错误）
      if (typeof window !== 'undefined' && PDFParse.setWorker && typeof PDFParse.setWorker === 'function') {
        try {
          // 设置worker源 - 使用CDN上的pdf-parse worker
          PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/browser/pdf.worker.min.mjs');
        } catch (workerError) {
          console.warn('Failed to set PDF worker source:', workerError);
          // 继续执行，某些环境可能不需要worker或已有默认配置
        }
      }

      // 使用Uint8Array而不是Buffer以兼容浏览器环境
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        // 清理PDF解析器资源
        try {
          if (parser.destroy && typeof parser.destroy === 'function') {
            await parser.destroy();
          }
        } catch (destroyError) {
          console.warn('Error cleaning up PDF parser:', destroyError);
        }
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      // 提供更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse PDF file: ${errorMessage}. Please ensure it is a valid PDF.`);
    }
  } else if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      // 动态导入mammoth库（仅在需要时加载）
      const mammothModule = await import('mammoth');
      // 处理不同的导出方式
      let extractRawText;
      if (mammothModule.extractRawText) {
        extractRawText = mammothModule.extractRawText;
      } else if (mammothModule.default && mammothModule.default.extractRawText) {
        extractRawText = mammothModule.default.extractRawText;
      } else if (mammothModule.default && typeof mammothModule.default === 'function') {
        // 向后兼容：如果默认导出是extractRawText函数
        extractRawText = mammothModule.default;
      } else {
        throw new Error('extractRawText function not found in mammoth module');
      }

      // @ts-ignore
      const result = await extractRawText({ arrayBuffer: buffer });
      text = result.value;
    } catch (error) {
      console.error('Error parsing Word document:', error);
      throw new Error('Failed to parse Word document. Please ensure it is a valid DOC/DOCX file.');
    }
  } else if (fileType === 'text/plain') {
    text = await file.text();
  } else {
    throw new Error('Unsupported file type. Please upload PDF, Word, or text file.');
  }

  return extractResumeInfo(text);
}

function extractResumeInfo(text: string): ResumeData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const sections: ResumeData['sections'] = {
    personalInfo: [],
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
  };

  const extractedInfo: ResumeData['extractedInfo'] = {};

  // Enhanced extraction logic with multilingual support
  let currentSection = '';
  let debugInfo: string[] = []; // For debugging purposes

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const originalLine = line;

    // Clean line for Chinese character detection
    const cleanLine = line.replace(/[^\w\u4e00-\u9fa5]/g, '').toLowerCase();

    // Detect section headers - support both English and Chinese
    // Work experience detection
    if (lowerLine.includes('experience') || lowerLine.includes('work') ||
        cleanLine.includes('工作经历') || cleanLine.includes('工作经验') ||
        cleanLine.includes('工作') || cleanLine.includes('经历')) {
      if (currentSection !== 'experience') {
        debugInfo.push(`切换到工作经历部分: "${originalLine}"`);
        currentSection = 'experience';
      }
    }
    // Education detection
    else if (lowerLine.includes('education') || lowerLine.includes('academic') ||
             cleanLine.includes('教育背景') || cleanLine.includes('教育经历') ||
             cleanLine.includes('教育') || cleanLine.includes('学历')) {
      if (currentSection !== 'education') {
        debugInfo.push(`切换到教育部分: "${originalLine}"`);
        currentSection = 'education';
      }
    }
    // Skills detection
    else if (lowerLine.includes('skill') || lowerLine.includes('technical') || lowerLine.includes('ability') ||
             cleanLine.includes('技能') || cleanLine.includes('专业技能') ||
             cleanLine.includes('技术') || cleanLine.includes('能力')) {
      if (currentSection !== 'skills') {
        debugInfo.push(`切换到技能部分: "${originalLine}"`);
        currentSection = 'skills';
      }
    }
    // Projects detection
    else if (lowerLine.includes('project') || lowerLine.includes('portfolio') ||
             cleanLine.includes('项目经历') || cleanLine.includes('项目经验') ||
             cleanLine.includes('项目') || cleanLine.includes('作品')) {
      if (currentSection !== 'projects') {
        debugInfo.push(`切换到项目部分: "${originalLine}"`);
        currentSection = 'projects';
      }
    }
    // Certifications detection
    else if (lowerLine.includes('certification') || lowerLine.includes('certificate') || lowerLine.includes('license') ||
             cleanLine.includes('证书') || cleanLine.includes('认证') ||
             cleanLine.includes('资格') || cleanLine.includes('执照')) {
      if (currentSection !== 'certifications') {
        debugInfo.push(`切换到证书部分: "${originalLine}"`);
        currentSection = 'certifications';
      }
    }
    // Personal info detection (but don't override if already in a specific section)
    else if ((lowerLine.includes('name') || lowerLine.includes('email') || lowerLine.includes('phone') ||
              lowerLine.includes('address') || lowerLine.includes('linkedin') || lowerLine.includes('github') ||
              lowerLine.includes('contact') || lowerLine.includes('个人信息') ||
              cleanLine.includes('姓名') || cleanLine.includes('邮箱') || cleanLine.includes('电话') ||
              cleanLine.includes('地址') || cleanLine.includes('联系方式')) &&
             !currentSection) {
      // Only switch to personalInfo if not already in another section
      if (currentSection !== 'personalInfo') {
        debugInfo.push(`切换到个人信息部分: "${originalLine}"`);
        currentSection = 'personalInfo';
      }
    }

    // Add line to appropriate section
    if (currentSection && sections[currentSection as keyof typeof sections]) {
      (sections[currentSection as keyof typeof sections] as string[]).push(line);
      debugInfo.push(`添加行到 ${currentSection}: "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`);
    } else if (line.length > 0) {
      // If no section detected but line is not empty, add to personalInfo as fallback
      if (!currentSection) {
        sections.personalInfo!.push(line);
        debugInfo.push(`未检测到部分，添加到个人信息: "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`);
      }
    }

    // Extract specific information with better pattern matching
    // Name extraction - support various formats
    if (!extractedInfo.name) {
      // English patterns: "Name: John Doe", "John Doe", etc.
      if (lowerLine.includes('name:') || lowerLine.includes('姓名:')) {
        extractedInfo.name = line.replace(/^(name|姓名):\s*/i, '').trim();
        debugInfo.push(`提取姓名(通过标签): ${extractedInfo.name}`);
      }
      // Chinese name pattern (2-4 Chinese characters)
      else if (/^[\u4e00-\u9fa5]{2,4}$/.test(line.trim())) {
        extractedInfo.name = line.trim();
        debugInfo.push(`提取姓名(中文名): ${extractedInfo.name}`);
      }
      // English name pattern (First Last)
      else if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(line)) {
        extractedInfo.name = line;
        debugInfo.push(`提取姓名(英文名): ${extractedInfo.name}`);
      }
    }

    // Email extraction
    if (!extractedInfo.email) {
      const emailMatch = line.match(/[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        extractedInfo.email = emailMatch[0];
        debugInfo.push(`提取邮箱: ${extractedInfo.email}`);
      }
    }

    // Phone extraction - support various formats
    if (!extractedInfo.phone) {
      const phoneMatch = line.match(/(\+\d[\d\s\-]+|\(\d{3}\)\s*\d{3}[-.]?\d{4}|\d{3}[-.]?\d{3}[-.]?\d{4}|1\d{10})/);
      if (phoneMatch) {
        extractedInfo.phone = phoneMatch[0];
        debugInfo.push(`提取电话: ${extractedInfo.phone}`);
      }
    }

    // Location extraction
    if (!extractedInfo.location) {
      // Check for location keywords
      const locationKeywords = ['location', 'address', 'city', '地址', '所在地', '城市', '地点'];
      const hasLocationKeyword = locationKeywords.some(keyword => lowerLine.includes(keyword));

      if (hasLocationKeyword) {
        // Extract location after keyword
        const locationMatch = line.match(/(?:location|address|city|地址|所在地|城市|地点)[:\s]*([^\n,]+)/i);
        if (locationMatch && locationMatch[1]) {
          extractedInfo.location = locationMatch[1].trim();
          debugInfo.push(`提取位置(通过关键词): ${extractedInfo.location}`);
        }
      }
      // Check for common Chinese city names
      else if (/北京|上海|广州|深圳|杭州|南京|成都|武汉|西安|重庆/.test(line)) {
        const cityMatch = line.match(/(北京|上海|广州|深圳|杭州|南京|成都|武汉|西安|重庆)/);
        if (cityMatch) {
          extractedInfo.location = cityMatch[1];
          debugInfo.push(`提取位置(中国城市): ${extractedInfo.location}`);
        }
      }
    }
  }

  // Log debug info in development
  if (process.env.NODE_ENV === 'development' && debugInfo.length > 0) {
    console.log('简历解析调试信息:');
    debugInfo.forEach((info, i) => console.log(`${i + 1}. ${info}`));
  }

  // Extract summary from first few lines
  const firstLines = lines.slice(0, 5).join(' ');
  if (firstLines.length > 0) {
    extractedInfo.summary = firstLines.substring(0, 200);
  }

  return {
    rawText: text,
    sections,
    extractedInfo,
  };
}

export function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'was', 'were', 'are', 'you', 'your']);
  const words = text.toLowerCase().split(/\W+/).filter(word =>
    word.length > 3 && !commonWords.has(word)
  );

  // Simple frequency analysis (can be improved)
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

// ==================== 新增：简历内容分类分块 ====================

import { KnowledgeCategory, classifyByKeywords } from './knowledgeCategories';

export interface CategorizedChunk {
  text: string;
  category: KnowledgeCategory;
  sourceSection?: string; // 来源章节：education, experience, skills等
  metadata?: Record<string, any>;
}

/**
 * 将简历数据转换为分类的知识块
 * @param resumeData 解析后的简历数据
 * @returns 分类后的知识块数组
 */
export function categorizeResumeContent(resumeData: ResumeData): CategorizedChunk[] {
  const chunks: CategorizedChunk[] = [];

  // 1. 处理个人提取信息
  const personalInfoEntries = Object.entries(resumeData.extractedInfo)
    .filter(([_, value]) => value && value.toString().trim().length > 0);

  if (personalInfoEntries.length > 0) {
    const personalText = personalInfoEntries
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    chunks.push({
      text: personalText,
      category: KnowledgeCategory.RESUME, // 个人信息属于简历类
      sourceSection: 'personalInfo',
      metadata: { type: 'extractedInfo' }
    });
  }

  // 2. 处理各个章节
  const sectionMapping: Record<string, KnowledgeCategory> = {
    personalInfo: KnowledgeCategory.RESUME,
    education: KnowledgeCategory.RESUME,
    experience: KnowledgeCategory.RESUME,
    projects: KnowledgeCategory.RESUME,
    skills: KnowledgeCategory.RESUME,
    certifications: KnowledgeCategory.RESUME,
  };

  for (const [sectionName, items] of Object.entries(resumeData.sections)) {
    if (!items || items.length === 0) continue;

    const baseCategory = sectionMapping[sectionName] || KnowledgeCategory.RESUME;

    // 将每个项目作为独立块处理
    items.forEach((item, index) => {
      // 对于技能部分，可能需要特殊处理（技能列表）
      if (sectionName === 'skills' && item.includes(',')) {
        // 技能可能是逗号分隔的列表，拆分成单个技能
        const skills = item.split(',').map(s => s.trim()).filter(s => s.length > 0);
        skills.forEach(skill => {
          chunks.push({
            text: skill,
            category: KnowledgeCategory.RESUME,
            sourceSection: sectionName,
            metadata: { type: 'skill', index }
          });
        });
      } else {
        // 正常处理为单个块
        let category = baseCategory;

        // 根据内容关键词调整分类
        const detectedCategory = classifyByKeywords(item);

        // 如果检测到的分类更具体，使用检测结果
        if (detectedCategory !== KnowledgeCategory.RESUME) {
          category = detectedCategory;
        }

        chunks.push({
          text: item,
          category,
          sourceSection: sectionName,
          metadata: { type: 'sectionItem', index }
        });
      }
    });
  }

  // 3. 处理原始文本中的其他内容（按段落分块）
  const rawText = resumeData.rawText;
  const paragraphs = rawText.split('\n\n').filter(p => p.trim().length > 20);

  paragraphs.forEach((paragraph, index) => {
    // 跳过已经包含在章节中的内容
    const isAlreadyIncluded = chunks.some(chunk =>
      chunk.text.includes(paragraph.substring(0, 50)) ||
      paragraph.includes(chunk.text.substring(0, 50))
    );

    if (!isAlreadyIncluded) {
      const category = classifyByKeywords(paragraph);
      chunks.push({
        text: paragraph,
        category,
        sourceSection: 'rawText',
        metadata: { type: 'paragraph', index }
      });
    }
  });

  console.log(`简历内容已分类为 ${chunks.length} 个知识块`);
  return chunks;
}

/**
 * 简化版：直接将简历文本分割并分类
 */
export function chunkAndClassifyText(text: string, chunkSize: number = 200): CategorizedChunk[] {
  const chunks: CategorizedChunk[] = [];

  // 简单按句子分割
  const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 10);

  let currentChunk = '';
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= chunkSize) {
      currentChunk += sentence + '. ';
    } else {
      if (currentChunk.trim().length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          category: classifyByKeywords(currentChunk)
        });
      }
      currentChunk = sentence + '. ';
    }
  }

  // 处理最后一块
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      category: classifyByKeywords(currentChunk)
    });
  }

  return chunks;
}