import { NextRequest, NextResponse } from 'next/server';
import { InterviewStorage } from '@/lib/interviewModels';
import { resourceProcessor } from '@/lib/resourceProcessor';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = id;
    const storage = InterviewStorage.getInstance();

    // 获取资源
    const resource = await storage.getResource(resourceId);
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // 解析请求体
    let newContent: string;
    try {
      const body = await request.json();
      if (typeof body.content !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid "content" field in request body' },
          { status: 400 }
        );
      }
      newContent = body.content;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // 更新资源内容
    resource.content = newContent;
    resource.updatedAt = new Date();
    resource.status = 'processed'; // 标记为已处理

    // 如果资源有OCR结果，也更新OCR文本块（可选）
    if (resource.metadata?.ocrResult?.textBlocks) {
      // 这里可以更新OCR结果的文本块，但为简化，我们只更新内容字段
      // 可以保留原有的OCR置信度等信息
    }

    // 保存资源
    const updatedResource = await storage.saveResource(resource);

    // 更新知识库中的知识块
    const updateResult = await resourceProcessor.updateResourceText(resourceId, newContent, {
      resourceType: resource.type,
    });

    if (!updateResult.success) {
      console.warn(`Failed to update knowledge chunks for resource ${resourceId}:`, updateResult.error);
      // 仍然返回成功，但记录警告
    }

    return NextResponse.json({
      success: true,
      resource: updatedResource,
      knowledgeUpdate: {
        success: updateResult.success,
        deletedCount: updateResult.deletedCount,
        newChunksCount: updateResult.chunks.length,
        error: updateResult.error,
      },
    });

  } catch (error) {
    console.error('Error updating resource content:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 可选：添加PATCH方法用于部分更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

// 可选：添加GET方法用于获取资源内容
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = id;
    const storage = InterviewStorage.getInstance();
    const resource = await storage.getResource(resourceId);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resource: {
        id: resource.id,
        title: resource.title,
        content: resource.content,
        type: resource.type,
        category: resource.category,
        status: resource.status,
        metadata: resource.metadata,
      },
    });

  } catch (error) {
    console.error('Error fetching resource content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}