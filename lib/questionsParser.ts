export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  isFavorite: boolean;
  source?: string;
  tags: string[];
  createdAt: Date;
}

export type QuestionCategory =
  | 'general'
  | 'technical'
  | 'behavioral'
  | 'scenario'
  | 'ai-product'
  | 'rag-design'
  | 'prompt-engineering'
  | 'system-design';

export function parseQuestionsFromText(text: string): Question[] {
  if (!text.trim()) return [];

  // Split by common delimiters: newlines, numbers, bullet points
  const lines = text.split(/\n|\r/).map(line => line.trim()).filter(line => line.length > 0);

  const questions: Question[] = [];
  let questionId = 1;

  for (const line of lines) {
    // Remove numbering and bullet points
    const cleanedText = line
      .replace(/^\d+[\.\)]\s*/, '')  // Remove "1. ", "2) "
      .replace(/^[-•*]\s*/, '')      // Remove bullet points
      .replace(/^[Qq]:\s*/, '')      // Remove "Q: "
      .trim();

    if (cleanedText.length < 5) continue; // Skip very short lines

    const category = categorizeQuestion(cleanedText);

    questions.push({
      id: `q${questionId++}`,
      text: cleanedText,
      category,
      isFavorite: false,
      tags: extractTags(cleanedText),
      createdAt: new Date(),
    });
  }

  return questions;
}

export function categorizeQuestion(text: string): QuestionCategory {
  const lowerText = text.toLowerCase();

  // AI and technical keywords
  const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural network'];
  const productKeywords = ['product', 'feature', 'roadmap', 'stakeholder', 'user', 'customer', 'metric'];
  const technicalKeywords = ['rag', 'retrieval augmented generation', 'vector', 'embedding', 'llm', 'model', 'api', 'system'];
  const promptKeywords = ['prompt', 'engineering', 'template', 'instruction', 'few-shot'];
  const behavioralKeywords = ['tell me about', 'describe a time', 'situation', 'challenge', 'conflict', 'teamwork'];
  const scenarioKeywords = ['how would you', 'design', 'implement', 'approach', 'strategy', 'plan'];

  if (aiKeywords.some(kw => lowerText.includes(kw)) && productKeywords.some(kw => lowerText.includes(kw))) {
    return 'ai-product';
  }

  if (technicalKeywords.some(kw => lowerText.includes(kw)) && lowerText.includes('rag')) {
    return 'rag-design';
  }

  if (promptKeywords.some(kw => lowerText.includes(kw))) {
    return 'prompt-engineering';
  }

  if (lowerText.includes('design') && (lowerText.includes('system') || lowerText.includes('architecture'))) {
    return 'system-design';
  }

  if (behavioralKeywords.some(kw => lowerText.includes(kw))) {
    return 'behavioral';
  }

  if (scenarioKeywords.some(kw => lowerText.includes(kw))) {
    return 'scenario';
  }

  if (technicalKeywords.some(kw => lowerText.includes(kw))) {
    return 'technical';
  }

  return 'general';
}

export function extractTags(text: string): string[] {
  const lowerText = text.toLowerCase();
  const allTags = [
    'ai', 'product', 'management', 'technical', 'behavioral', 'scenario',
    'rag', 'retrieval', 'vector', 'embedding', 'llm', 'prompt', 'engineering',
    'design', 'system', 'architecture', 'metric', 'evaluation', 'ethics',
    'teamwork', 'leadership', 'communication', 'problem-solving'
  ];

  return allTags.filter(tag => lowerText.includes(tag));
}

export function categorizeQuestionsByType(questions: Question[]): Record<QuestionCategory, Question[]> {
  const categories: Record<QuestionCategory, Question[]> = {
    'general': [],
    'technical': [],
    'behavioral': [],
    'scenario': [],
    'ai-product': [],
    'rag-design': [],
    'prompt-engineering': [],
    'system-design': [],
  };

  questions.forEach(question => {
    categories[question.category].push(question);
  });

  return categories;
}

export function filterQuestions(questions: Question[], options: {
  category?: QuestionCategory;
  searchText?: string;
  favoritesOnly?: boolean;
}): Question[] {
  return questions.filter(question => {
    if (options.category && question.category !== options.category) {
      return false;
    }

    if (options.searchText && !question.text.toLowerCase().includes(options.searchText.toLowerCase())) {
      return false;
    }

    if (options.favoritesOnly && !question.isFavorite) {
      return false;
    }

    return true;
  });
}

export function markAsFavorite(questions: Question[], questionId: string, isFavorite: boolean): Question[] {
  return questions.map(q =>
    q.id === questionId ? { ...q, isFavorite } : q
  );
}

export function deleteQuestion(questions: Question[], questionId: string): Question[] {
  return questions.filter(q => q.id !== questionId);
}