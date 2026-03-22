import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI-compatible client with DeepSeek API
// Priority: DEEPSEEK_API_KEY then OPENAI_API_KEY (for compatibility)
const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://api.deepseek.com',
});

// Validation schema for request body
const GenerateQuestionsSchema = z.object({
  resumeText: z.string().optional(),
  importedQuestions: z.array(z.string()).optional(),
  questionTypes: z.object({
    general: z.number().min(0).max(100),
    technical: z.number().min(0).max(100),
    behavioral: z.number().min(0).max(100),
  }),
  position: z.string().optional(),
  industry: z.string().optional(),
  contextChunks: z.array(z.object({
    text: z.string(),
    category: z.string(),
    source: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateQuestionsSchema.parse(body);

    // Construct prompt based on input data
    const prompt = constructPrompt(validatedData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach specializing in AI product management and technical roles. Generate relevant interview questions based on the user's background and preferences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedText = completion.choices[0]?.message?.content || '';
    const questions = parseGeneratedQuestions(generatedText);

    return NextResponse.json({
      success: true,
      questions,
      rawResponse: generatedText,
    });

  } catch (error) {
    console.error('Error generating questions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function constructPrompt(data: z.infer<typeof GenerateQuestionsSchema>): string {
  const { resumeText, importedQuestions, questionTypes, position, industry, contextChunks } = data;

  let prompt = `Generate interview questions with the following distribution:\n`;
  prompt += `- General questions: ${questionTypes.general}%\n`;
  prompt += `- Technical questions: ${questionTypes.technical}%\n`;
  prompt += `- Behavioral questions: ${questionTypes.behavioral}%\n\n`;

  if (position) {
    prompt += `Target position: ${position}\n`;
  }
  if (industry) {
    prompt += `Industry: ${industry}\n`;
  }

  // 如果有检索到的上下文，优先使用
  if (contextChunks && contextChunks.length > 0) {
    prompt += `\n=== RELEVANT CONTEXT FROM CANDIDATE'S BACKGROUND ===\n`;
    prompt += `Here are specific details from the candidate's background that should inform your questions:\n\n`;

    contextChunks.forEach((chunk, index) => {
      prompt += `[Context ${index + 1} - ${chunk.category}]:\n`;
      prompt += `${chunk.text}\n\n`;
    });

    prompt += `=== END CONTEXT ===\n\n`;
    prompt += `Please generate questions that specifically reference these details when relevant. `;
    prompt += `For technical questions, focus on the skills and projects mentioned. `;
    prompt += `For behavioral questions, consider the experiences described.\n\n`;
  } else if (resumeText) {
    // 回退到原始简历文本
    prompt += `\nHere is the candidate's resume summary:\n${resumeText.substring(0, 2000)}\n\n`;
  }

  if (importedQuestions && importedQuestions.length > 0) {
    prompt += `\nHere are some example questions to use as inspiration:\n`;
    importedQuestions.forEach((q, i) => {
      prompt += `${i + 1}. ${q}\n`;
    });
  }

  prompt += `\nPlease generate a list of interview questions that match the distribution above. `;
  prompt += `Format the response as a JSON array of objects, where each object has "id", "text", "category" (general/technical/behavioral), and "difficulty" (easy/medium/hard). `;
  prompt += `Return ONLY the JSON array, no other text.`;

  return prompt;
}

function parseGeneratedQuestions(text: string): any[] {
  try {
    // Try to extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: split by lines and create simple structure
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.map((line, index) => ({
      id: index + 1,
      text: line.replace(/^\d+\.\s*/, '').trim(),
      category: 'general',
      difficulty: 'medium',
    }));
  } catch (error) {
    console.error('Error parsing generated questions:', error);
    return [];
  }
}