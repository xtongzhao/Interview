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
const GenerateFollowupSchema = z.object({
  currentQuestion: z.string(),
  userAnswer: z.string(),
  prompt: z.string().optional(), // 系统提示词
  jobDescription: z.string().optional(), // 岗位JD描述
  contextChunks: z.array(z.object({
    text: z.string(),
    category: z.string(),
    source: z.string().optional(),
    chunkId: z.string().optional(),
  })).optional(),
  isFollowup: z.boolean().optional().default(true),
  isDynamic: z.boolean().optional().default(false),
  conversationHistory: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateFollowupSchema.parse(body);

    // Construct prompt for follow-up question
    const prompt = constructFollowupPrompt(validatedData);

    // Call OpenAI API
    const systemMessage = validatedData.prompt || "You are an expert interviewer skilled at asking insightful follow-up questions to deepen understanding of a candidate's knowledge and experience.";

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const generatedText = completion.choices[0]?.message?.content || '';
    const followupQuestion = parseFollowupQuestion(generatedText, validatedData);

    return NextResponse.json({
      success: true,
      followupQuestion,
      rawResponse: generatedText,
    });

  } catch (error) {
    console.error('Error generating follow-up question:', error);

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

function constructFollowupPrompt(data: z.infer<typeof GenerateFollowupSchema>): string {
  const { currentQuestion, userAnswer, prompt: userPrompt, jobDescription, contextChunks, isDynamic, conversationHistory } = data;

  if (isDynamic) {
    // 动态问题生成模式：基于对话历史生成新的相关问题
    let prompt = `Generate a thoughtful NEW interview question based on the conversation history below:\n\n`;

    // 对话历史
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `=== CONVERSATION HISTORY ===\n`;
      conversationHistory.forEach((exchange, index) => {
        prompt += `[Exchange ${index + 1}]:\n`;
        prompt += `Interviewer: "${exchange.question}"\n`;
        prompt += `Candidate: "${exchange.answer.substring(0, 500)}${exchange.answer.length > 500 ? '...' : ''}"\n\n`;
      });
    } else {
      // 如果没有对话历史，使用当前问答
      prompt += `=== CURRENT EXCHANGE ===\n`;
      prompt += `Interviewer Question: "${currentQuestion}"\n\n`;
      prompt += `Candidate Answer: "${userAnswer.substring(0, 1000)}${userAnswer.length > 1000 ? '...' : ''}"\n\n`;
    }

    // 岗位JD上下文
    if (jobDescription && jobDescription.trim()) {
      prompt += `=== JOB DESCRIPTION ===\n`;
      prompt += `${jobDescription}\n\n`;
      prompt += `The new question should help assess the candidate's fit for this specific role.\n\n`;
    }

    // 知识库上下文
    if (contextChunks && contextChunks.length > 0) {
      prompt += `=== RELEVANT KNOWLEDGE CONTEXT ===\n`;
      prompt += `Here are relevant details from the candidate's knowledge base:\n\n`;

      contextChunks.forEach((chunk, index) => {
        prompt += `[Context ${index + 1} - ${chunk.category}]:\n`;
        prompt += `${chunk.text.substring(0, 500)}${chunk.text.length > 500 ? '...' : ''}\n\n`;
      });

      prompt += `=== END CONTEXT ===\n\n`;
      prompt += `Use this context to ask informed questions.\n\n`;
    }

    // 指示
    prompt += `=== INSTRUCTIONS ===\n`;
    prompt += `1. Ask ONE thoughtful NEW question that explores a different but related aspect\n`;
    prompt += `2. The question should be based on the conversation flow, not a direct follow-up\n`;
    prompt += `3. It can explore a new topic, skill area, or scenario related to the job\n`;
    prompt += `4. Make it specific to what you've learned about the candidate so far\n`;
    prompt += `5. Keep the question concise and focused\n\n`;

    prompt += `Format the response as a JSON object with "text" field containing the question. `;
    prompt += `You may optionally include "category" (general/technical/behavioral/scenario/product/experience) and "difficulty" (easy/medium/hard). `;
    prompt += `Return ONLY the JSON object, no other text.`;

    return prompt;
  } else {
    // 原始跟进问题模式
    let prompt = `Generate a thoughtful follow-up question based on the interview exchange below:\n\n`;

    // 当前问题和回答
    prompt += `=== CURRENT INTERVIEW EXCHANGE ===\n`;
    prompt += `Interviewer Question: "${currentQuestion}"\n\n`;
    prompt += `Candidate Answer: "${userAnswer.substring(0, 1000)}${userAnswer.length > 1000 ? '...' : ''}"\n\n`;

    // 岗位JD上下文
    if (jobDescription && jobDescription.trim()) {
      prompt += `=== JOB DESCRIPTION ===\n`;
      prompt += `${jobDescription}\n\n`;
      prompt += `The follow-up question should help assess the candidate's fit for this specific role.\n\n`;
    }

    // 知识库上下文
    if (contextChunks && contextChunks.length > 0) {
      prompt += `=== RELEVANT KNOWLEDGE CONTEXT ===\n`;
      prompt += `Here are relevant details from the candidate's knowledge base:\n\n`;

      contextChunks.forEach((chunk, index) => {
        prompt += `[Context ${index + 1} - ${chunk.category}]:\n`;
        prompt += `${chunk.text.substring(0, 500)}${chunk.text.length > 500 ? '...' : ''}\n\n`;
      });

      prompt += `=== END CONTEXT ===\n\n`;
      prompt += `Use this context to ask more specific, informed follow-up questions.\n\n`;
    }

    // 指示
    prompt += `=== INSTRUCTIONS ===\n`;
    prompt += `1. Ask ONE thoughtful follow-up question that digs deeper into the candidate's answer\n`;
    prompt += `2. The question should explore assumptions, seek clarification, or probe for more detail\n`;
    prompt += `3. Make it specific to the candidate's response, not generic\n`;
    prompt += `4. If relevant, connect to the job requirements or knowledge base context\n`;
    prompt += `5. Keep the question concise and focused\n\n`;

    prompt += `Format the response as a JSON object with "text" field containing the follow-up question. `;
    prompt += `You may optionally include "category" (general/technical/behavioral/scenario/product/experience) and "difficulty" (easy/medium/hard). `;
    prompt += `Return ONLY the JSON object, no other text.`;

    return prompt;
  }
}

function parseFollowupQuestion(text: string, data: z.infer<typeof GenerateFollowupSchema>): any {
  try {
    // Try to extract JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Ensure it has at least a text field
      if (parsed.text) {
        return parsed;
      }
    }

    // Fallback: use the entire text as the question
    return {
      text: text.trim(),
      category: 'general',
      difficulty: 'medium',
    };
  } catch (error) {
    console.error('Error parsing follow-up question:', error);
    // Return a default follow-up question
    return {
      text: "Could you elaborate on that point with a specific example?",
      category: 'general',
      difficulty: 'medium',
    };
  }
}