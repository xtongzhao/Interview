import { KnowledgeCategory, classifyByKeywords } from './knowledgeCategories';

// 简化的知识块
export interface SimpleChunk {
  id: string;
  text: string;
  category: KnowledgeCategory;
  isMastered: boolean; // 简单0/1掌握度
  createdAt: Date;
  metadata?: Record<string, any>; // 扩展元数据
}

// 分类向量存储 - MVP版本
export class SimpleVectorStore {
  private collections: Map<KnowledgeCategory, SimpleChunk[]> = new Map();
  private initialized = false;

  constructor() {
    // 初始化所有分类的存储
    this.initializeCollections();
  }

  private initializeCollections() {
    if (this.initialized) return;

    // 为每个分类创建空数组
    Object.values(KnowledgeCategory).forEach(category => {
      this.collections.set(category, []);
    });

    // 尝试加载本地存储的数据
    this.loadFromLocalStorage();

    this.initialized = true;
    console.log('SimpleVectorStore initialized with memory storage');
  }

  // 存储知识块（自动分类）
  async storeContent(text: string, metadata?: Partial<SimpleChunk>): Promise<SimpleChunk> {
    // 自动分类
    const category = classifyByKeywords(text);

    const chunk: SimpleChunk = {
      id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      isMastered: false,
      createdAt: new Date(),
      metadata: metadata || {},
    };

    // 存储到对应分类
    const collection = this.collections.get(category);
    if (collection) {
      collection.push(chunk);
    } else {
      // 如果分类不存在，创建新分类（理论上不会发生）
      this.collections.set(category, [chunk]);
    }

    // 保存到本地存储
    this.saveToLocalStorage();

    console.log(`Stored content to category ${category}: ${text.substring(0, 50)}...`);
    return chunk;
  }

  // 批量存储内容
  async storeContents(texts: string[], metadata?: Partial<SimpleChunk>): Promise<SimpleChunk[]> {
    const chunks: SimpleChunk[] = [];
    for (const text of texts) {
      const chunk = await this.storeContent(text, metadata);
      chunks.push(chunk);
    }
    return chunks;
  }

  // 按类别检索（排除已掌握的）
  async retrieveByCategory(
    category: KnowledgeCategory,
    query?: string,
    options: {
      excludeMastered?: boolean;
      limit?: number;
    } = {}
  ): Promise<SimpleChunk[]> {
    const collection = this.collections.get(category);
    if (!collection || collection.length === 0) {
      return [];
    }

    let results = [...collection];

    // 排除已掌握的内容
    if (options.excludeMastered) {
      results = results.filter(chunk => !chunk.isMastered);
    }

    // 如果有查询词，计算相关性分数并排序
    if (query && query.trim()) {
      // 计算每个块的相关性分数
      const scoredResults = results.map(chunk => {
        const score = this.calculateRelevanceScore(chunk.text, query);
        return { chunk, score };
      });

      // 按分数降序排序
      scoredResults.sort((a, b) => b.score - a.score);

      // 过滤掉分数为0的结果（可选）
      results = scoredResults
        .filter(item => item.score > 0.01)
        .map(item => item.chunk);
    } else {
      // 没有查询词时，按创建时间排序（新的在前）
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // 限制数量
    const limit = options.limit || 5;
    return results.slice(0, limit);
  }

  // 标记为已掌握
  async markAsMastered(chunkId: string, category: KnowledgeCategory): Promise<boolean> {
    const collection = this.collections.get(category);
    if (!collection) return false;

    const chunkIndex = collection.findIndex(chunk => chunk.id === chunkId);
    if (chunkIndex === -1) return false;

    // 更新掌握状态
    collection[chunkIndex].isMastered = true;

    // 保存到本地存储
    this.saveToLocalStorage();

    console.log(`Marked chunk ${chunkId} as mastered`);
    return true;
  }

  // 获取类别统计
  async getCategoryStats() {
    const stats: Record<KnowledgeCategory, { total: number; mastered: number }> = {} as any;

    for (const category of Object.values(KnowledgeCategory)) {
      const collection = this.collections.get(category) || [];
      const mastered = collection.filter(chunk => chunk.isMastered).length;

      stats[category] = {
        total: collection.length,
        mastered,
      };
    }

    return stats;
  }

  // 获取所有内容
  async getAllContents(category?: KnowledgeCategory): Promise<SimpleChunk[]> {
    if (category) {
      return this.collections.get(category) || [];
    }

    // 返回所有内容
    const allContents: SimpleChunk[] = [];
    for (const collection of this.collections.values()) {
      allContents.push(...collection);
    }
    return allContents;
  }

  // 删除内容
  async deleteContent(chunkId: string, category: KnowledgeCategory): Promise<boolean> {
    const collection = this.collections.get(category);
    if (!collection) return false;

    const initialLength = collection.length;
    this.collections.set(
      category,
      collection.filter(chunk => chunk.id !== chunkId)
    );

    const deleted = initialLength !== this.collections.get(category)!.length;
    if (deleted) {
      this.saveToLocalStorage();
    }

    return deleted;
  }

  // 更新内容
  async updateContent(chunkId: string, updates: Partial<SimpleChunk>): Promise<boolean> {
    let found = false;

    // 遍历所有分类查找对应的块
    for (const [category, collection] of this.collections.entries()) {
      const chunkIndex = collection.findIndex(chunk => chunk.id === chunkId);
      if (chunkIndex !== -1) {
        // 如果更新了文本，可能需要重新分类
        const oldChunk = collection[chunkIndex];
        const newChunk = { ...oldChunk, ...updates };

        // 如果文本已更改，检查是否需要重新分类
        if (updates.text && updates.text !== oldChunk.text) {
          const newCategory = classifyByKeywords(updates.text);
          if (newCategory !== category) {
            // 移动到新分类
            this.collections.set(
              category,
              collection.filter(chunk => chunk.id !== chunkId)
            );
            const newCollection = this.collections.get(newCategory) || [];
            newCollection.push(newChunk);
            this.collections.set(newCategory, newCollection);
          } else {
            // 同一分类内更新
            collection[chunkIndex] = newChunk;
          }
        } else {
          // 仅更新其他字段
          collection[chunkIndex] = newChunk;
        }

        found = true;
        break;
      }
    }

    if (found) {
      this.saveToLocalStorage();
      console.log(`Updated chunk ${chunkId}`);
    }

    return found;
  }

  // 清除所有数据
  async clearAll(): Promise<void> {
    this.collections.clear();
    this.initializeCollections();
    // 防止在服务器端访问 localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('simple_vector_store');
    }
    console.log('Cleared all vector store data');
  }

  // 本地存储相关方法
  private saveToLocalStorage() {
    // 防止在服务器端访问 localStorage
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data: Record<string, SimpleChunk[]> = {};
      for (const [category, collection] of this.collections.entries()) {
        data[category] = collection;
      }
      localStorage.setItem('simple_vector_store', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorage() {
    // 防止在服务器端访问 localStorage
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem('simple_vector_store');
      if (!saved) return;

      const data = JSON.parse(saved);
      for (const [category, collection] of Object.entries(data)) {
        if (Object.values(KnowledgeCategory).includes(category as KnowledgeCategory)) {
          // 转换日期字符串回Date对象
          const typedCollection = (collection as any[]).map(chunk => ({
            ...chunk,
            createdAt: new Date(chunk.createdAt),
          }));
          this.collections.set(category as KnowledgeCategory, typedCollection);
        }
      }
      console.log('Loaded vector store data from localStorage');
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  // 辅助方法：洗牌算法
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // 简单文本相似度计算（可用于未来扩展）
  private calculateSimilarity(text1: string, text2: string): number {
    // 简化的相似度计算：共同词汇比例
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  // 计算查询与文本的相关性分数
  private calculateRelevanceScore(text: string, query: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // 1. 完全匹配（加分最多）
    if (lowerText.includes(lowerQuery)) {
      return 1.0;
    }

    // 2. 分词匹配
    const queryWords = lowerQuery.split(/\W+/).filter(w => w.length > 2);
    const textWords = new Set(lowerText.split(/\W+/));

    if (queryWords.length === 0) return 0;

    const matchedWords = queryWords.filter(word => textWords.has(word));
    const wordScore = matchedWords.length / queryWords.length;

    // 3. 考虑文本长度（短文本可能更相关）
    const lengthScore = 1 / (1 + Math.log(text.length / 100));

    // 4. 使用Jaccard相似度作为补充
    const jaccardScore = this.calculateSimilarity(text, query);

    // 综合分数
    return wordScore * 0.5 + lengthScore * 0.2 + jaccardScore * 0.3;
  }
}