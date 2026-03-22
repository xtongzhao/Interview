import { NextRequest, NextResponse } from 'next/server';
import { BaiduOCRService } from '@/lib/baiduOCR';

// 初始化百度OCR服务
const ocrService = new BaiduOCRService(
  process.env.BAIDU_OCR_API_KEY || '',
  process.env.BAIDU_OCR_SECRET_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.BAIDU_OCR_API_KEY || !process.env.BAIDU_OCR_SECRET_KEY) {
      console.warn('百度OCR API密钥未配置，请在.env.local中设置BAIDU_OCR_API_KEY和BAIDU_OCR_SECRET_KEY');
      return NextResponse.json(
        { error: 'OCR服务未配置，请配置百度OCR API密钥' },
        { status: 500 }
      );
    }

    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未提供图片文件' },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '文件不是图片格式' },
        { status: 400 }
      );
    }

    // 限制文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片文件大小不能超过5MB' },
        { status: 400 }
      );
    }

    console.log(`处理OCR请求: ${file.name} (${file.type}, ${file.size} bytes)`);

    // 调用百度OCR服务
    const result = await ocrService.recognizeText(file, {
      language: 'CHN_ENG', // 中英文混合
      detect_direction: true, // 检测图像朝向
    });

    return NextResponse.json({
      success: true,
      result: {
        text: result.text,
        confidence: result.confidence,
        language: result.language,
        textBlocks: result.textBlocks,
        processingTime: result.processingTime,
      },
    });

  } catch (error) {
    console.error('OCR处理错误:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      {
        error: 'OCR处理失败',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// 可选：添加GET方法用于检查服务状态
export async function GET(request: NextRequest) {
  const isConfigured = !!(process.env.BAIDU_OCR_API_KEY && process.env.BAIDU_OCR_SECRET_KEY);

  return NextResponse.json({
    service: 'baidu-ocr',
    configured: isConfigured,
    message: isConfigured ? 'OCR服务已配置' : 'OCR服务未配置，请设置环境变量',
  });
}