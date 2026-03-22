// 固定分类定义 - MVP版本
// 四个固定分类，符合用户需求

export enum KnowledgeCategory {
  RESUME = 'resume',           // 简历类：个人经历、技能、项目
  SCENARIO = 'scenario',       // 情景类：案例分析、行为面试
  LLM_KNOWLEDGE = 'llm_knowledge', // 大模型知识：AI技术、原理
  CREATIVE_THINKING = 'creative_thinking', // 思维发散：创新问题、开放思考
}

// 分类描述（用于UI展示）
export const CategoryConfig = {
  [KnowledgeCategory.RESUME]: {
    name: '简历相关',
    description: '个人经历、技能、项目经验',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-700',
    icon: '📄',
  },
  [KnowledgeCategory.SCENARIO]: {
    name: '情景模拟',
    description: '案例分析、行为面试题',
    color: 'green',
    badgeClass: 'bg-green-100 text-green-700',
    icon: '🎭',
  },
  [KnowledgeCategory.LLM_KNOWLEDGE]: {
    name: '大模型知识',
    description: 'AI技术、原理、最新进展',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-700',
    icon: '🧠',
  },
  [KnowledgeCategory.CREATIVE_THINKING]: {
    name: '思维发散',
    description: '创新问题、开放思考',
    color: 'orange',
    badgeClass: 'bg-orange-100 text-orange-700',
    icon: '💡',
  },
} as const;

// 简单分类规则（关键词匹配） - MVP版本
export function classifyByKeywords(text: string): KnowledgeCategory {
  const lowerText = text.toLowerCase();

  // 简历类关键词
  if (lowerText.includes('简历') || lowerText.includes('resume') ||
      lowerText.includes('项目') || lowerText.includes('project') ||
      lowerText.includes('经验') || lowerText.includes('experience') ||
      lowerText.includes('技能') || lowerText.includes('skill') ||
      lowerText.includes('工作') || lowerText.includes('work') ||
      lowerText.includes('教育') || lowerText.includes('education')) {
    return KnowledgeCategory.RESUME;
  }

  // 情景类关键词
  if (lowerText.includes('如果') || lowerText.includes('if') ||
      lowerText.includes('假设') || lowerText.includes('scenario') ||
      lowerText.includes('情景') || lowerText.includes('situation') ||
      lowerText.includes('案例') || lowerText.includes('case') ||
      lowerText.includes('如何处理') || lowerText.includes('how would you') ||
      lowerText.includes('你会怎样') || lowerText.includes('what would you')) {
    return KnowledgeCategory.SCENARIO;
  }

  // 大模型知识关键词
  if (lowerText.includes('ai') || lowerText.includes('人工智能') ||
      lowerText.includes('模型') || lowerText.includes('model') ||
      lowerText.includes('transformer') || lowerText.includes('gpt') ||
      lowerText.includes('llm') || lowerText.includes('大语言模型') ||
      lowerText.includes('机器学习') || lowerText.includes('machine learning') ||
      lowerText.includes('深度学习') || lowerText.includes('deep learning') ||
      lowerText.includes('算法') || lowerText.includes('algorithm') ||
      lowerText.includes('神经网络') || lowerText.includes('neural network')) {
    return KnowledgeCategory.LLM_KNOWLEDGE;
  }

  // 思维发散关键词
  if (lowerText.includes('创新') || lowerText.includes('innovation') ||
      lowerText.includes('发散') || lowerText.includes('divergent') ||
      lowerText.includes('开放') || lowerText.includes('open-ended') ||
      lowerText.includes('思考') || lowerText.includes('thinking') ||
      lowerText.includes('创意') || lowerText.includes('creative') ||
      lowerText.includes('脑洞') || lowerText.includes('brainstorm')) {
    return KnowledgeCategory.CREATIVE_THINKING;
  }

  // 默认：简历类（大部分个人内容都属于简历）
  return KnowledgeCategory.RESUME;
}

// 辅助函数：获取所有分类
export function getAllCategories(): KnowledgeCategory[] {
  return Object.values(KnowledgeCategory);
}

// 辅助函数：根据分类获取配置
export function getCategoryConfig(category: KnowledgeCategory) {
  return CategoryConfig[category];
}