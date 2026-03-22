import { OCRService, OCROptions, OCRResult, TextBlock } from './resourceProcessor';

// 百度OCR API配置
interface BaiduOCRConfig {
  apiKey: string;
  secretKey: string;
}

// 百度OCR API响应类型
interface BaiduOCRTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface BaiduOCRWord {
  words: string;
}

interface BaiduOCRWordsResult {
  words_result: BaiduOCRWord[];
  words_result_num: number;
  log_id: string;
  direction?: number;
}

// 百度OCR服务实现
export class BaiduOCRService implements OCRService {
  private apiKey: string;
  private secretKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  /**
   * 提取图片中的文本（实现OCRService接口）
   */
  async extractText(imageFile: File, options?: OCROptions): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      // 获取access token（会自动缓存）
      const accessToken = await this.getAccessToken();

      // 将File转换为base64
      const base64Image = await this.fileToBase64(imageFile);

      // 调用百度OCR API
      const baiduResult = await this.callBaiduOCRAPI(accessToken, base64Image, options);

      // 转换为统一格式
      const result = this.mapBaiduResultToOCRResult(baiduResult, startTime);

      console.log(`百度OCR识别完成: ${result.textBlocks.length}个文本块，置信度: ${result.confidence}`);
      return result;

    } catch (error) {
      console.error('百度OCR识别失败:', error);
      throw new Error(`OCR识别失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 专门为API路由设计的方法（直接使用base64）
   */
  async recognizeText(imageFile: File, options?: any): Promise<OCRResult> {
    return this.extractText(imageFile, options);
  }

  /**
   * 获取百度API access token
   */
  private async getAccessToken(): Promise<string> {
    // 检查token是否有效（缓存1小时）
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token';
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.apiKey,
      client_secret: this.secretKey,
    });

    try {
      const response = await fetch(`${tokenUrl}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data: BaiduOCRTokenResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error_description || data.error || '获取access token失败');
      }

      if (!data.access_token) {
        throw new Error('未获取到access token');
      }

      // 缓存token（提前5分钟过期）
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in || 2592000) * 1000 - 5 * 60 * 1000;

      console.log('百度OCR access token获取成功');
      return this.accessToken;

    } catch (error) {
      console.error('获取百度OCR access token失败:', error);
      throw new Error(`无法获取OCR访问令牌: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 调用百度OCR API
   */
  private async callBaiduOCRAPI(
    accessToken: string,
    base64Image: string,
    options?: OCROptions
  ): Promise<BaiduOCRWordsResult> {
    const apiUrl = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';

    // 移除base64前缀（data:image/png;base64,）
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const params = new URLSearchParams({
      access_token: accessToken,
      image: cleanBase64,
      language_type: options?.language === 'eng' ? 'ENG' : 'CHN_ENG',
      detect_direction: 'true',
      paragraph: 'true',
      probability: 'true',
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('百度OCR API错误:', errorText);
      throw new Error(`OCR API请求失败: ${response.status} ${response.statusText}`);
    }

    const data: BaiduOCRWordsResult = await response.json();

    // 检查错误
    if (data['error_code']) {
      const errorCode = data['error_code'];
      const errorMsg = data['error_msg'] || '未知错误';
      throw new Error(`百度OCR错误 ${errorCode}: ${errorMsg}`);
    }

    return data;
  }

  /**
   * 将百度OCR结果转换为统一格式
   */
  private mapBaiduResultToOCRResult(
    baiduResult: BaiduOCRWordsResult,
    startTime: number
  ): OCRResult {
    const processingTime = Date.now() - startTime;
    const wordsResult = baiduResult.words_result || [];

    // 提取所有文本
    const fullText = wordsResult.map(item => item.words).join('\n');

    // 计算平均置信度（如果有概率信息）
    let confidence = 0.8; // 默认置信度
    if (baiduResult['probability'] && baiduResult['probability'].average) {
      confidence = baiduResult['probability'].average;
    }

    // 转换为文本块
    const textBlocks: TextBlock[] = wordsResult.map((item, index) => {
      const block: TextBlock = {
        text: item.words,
        confidence: confidence,
      };

      // 如果有位置信息（百度高精度版可能返回）
      if (item['location']) {
        const location = item['location'];
        block.boundingBox = {
          x: location.left || 0,
          y: location.top || 0,
          width: location.width || 0,
          height: location.height || 0,
        };
      }

      return block;
    });

    return {
      text: fullText,
      confidence,
      language: 'zh',
      textBlocks,
      processingTime,
    };
  }

  /**
   * 将File对象转换为base64字符串
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// 导出单例实例（如果API密钥已配置）
export function createBaiduOCRService(): OCRService | null {
  const apiKey = process.env.BAIDU_OCR_API_KEY;
  const secretKey = process.env.BAIDU_OCR_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.warn('百度OCR API密钥未配置，使用SimpleOCRService占位符');
    return null;
  }

  return new BaiduOCRService(apiKey, secretKey);
}