"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { parseResume, type ResumeData } from "@/lib/resumeParser";

export default function ResumePage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved resume data from localStorage on mount
  useEffect(() => {
    const savedResume = localStorage.getItem('resume-analysis');
    if (savedResume) {
      try {
        const parsedResume = JSON.parse(savedResume);
        setResumeData(parsedResume);
      } catch (error) {
        console.error('Error loading saved resume:', error);
      }
    }
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
      setUploadError('不支持的文件类型。请上传PDF、Word或文本文件。');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('文件太大。最大支持10MB。');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const parsedData = await parseResume(file);
      setResumeData(parsedData);

      // Save to localStorage for use in other parts of the app
      localStorage.setItem('resume-analysis', JSON.stringify(parsedData));

      setUploadSuccess(true);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      setUploadError(error instanceof Error ? error.message : '解析简历时发生错误。');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // Create a fake change event to reuse the same handler
    const fakeEvent = {
      target: {
        files: [file]
      },
      currentTarget: { files: [file] } as any,
      nativeEvent: event.nativeEvent,
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      preventDefault: () => {},
      isDefaultPrevented: () => false,
      stopPropagation: () => {},
      isPropagationStopped: () => false,
      persist: () => {},
      timeStamp: Date.now(),
      type: 'change'
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    handleFileChange(fakeEvent);
  };

  const handleDownloadAnalysis = () => {
    if (!resumeData) return;

    const data = {
      generatedAt: new Date().toISOString(),
      ...resumeData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearResume = () => {
    if (confirm('确定要清除已上传的简历数据吗？')) {
      setResumeData(null);
      localStorage.removeItem('resume-analysis');
      setUploadSuccess(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">个人资料管理</h1>
        <p className="text-muted-foreground">
          上传并分析您的简历，构建个人资料知识库。AI将提取关键信息用于个性化面试准备。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传简历
            </CardTitle>
            <CardDescription>
              支持格式：PDF, DOC, DOCX, TXT。最大文件大小：10MB。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
            />

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
              onClick={handleFileSelect}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              ) : uploadSuccess ? (
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              ) : (
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
              )}

              <p className="mt-2">
                {isUploading ? '正在解析简历...' :
                 uploadSuccess ? '简历上传成功！' :
                 '拖放简历至此，或点击浏览'}
              </p>

              <Button className="mt-4" disabled={isUploading}>
                {isUploading ? '处理中...' : '选择文件'}
              </Button>

              <p className="text-sm text-muted-foreground mt-2">
                或直接将文件拖放到此区域
              </p>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{uploadError}</p>
              </div>
            )}

            {uploadSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <p className="text-sm">简历解析完成！信息已保存。</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>您的简历在本地处理，永远不会上传到云端。</p>
              {resumeData && (
                <p className="mt-1">
                  已上传简历: {resumeData.extractedInfo.name || '未知姓名'} • {resumeData.rawText.length} 字符
                </p>
              )}
            </div>

            {resumeData && (
              <Button variant="outline" onClick={handleClearResume} className="w-full">
                清除简历数据
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              简历分析
            </CardTitle>
            <CardDescription>
              {resumeData ? '从您的简历中提取的信息' : '上传简历后显示分析结果'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resumeData ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">个人信息</h3>
                  <div className="mt-2 space-y-1">
                    {resumeData.extractedInfo.name && <p className="text-sm">姓名: {resumeData.extractedInfo.name}</p>}
                    {resumeData.extractedInfo.email && <p className="text-sm">邮箱: {resumeData.extractedInfo.email}</p>}
                    {resumeData.extractedInfo.phone && <p className="text-sm">电话: {resumeData.extractedInfo.phone}</p>}
                    {resumeData.extractedInfo.summary && <p className="text-sm">摘要: {resumeData.extractedInfo.summary}</p>}
                    {resumeData.sections.personalInfo && resumeData.sections.personalInfo.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">其他信息:</p>
                        <ul className="text-xs list-disc list-inside">
                          {resumeData.sections.personalInfo.slice(0, 3).map((info, i) => (
                            <li key={i}>{info}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">工作经历</h3>
                  {resumeData.sections.experience && resumeData.sections.experience.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {resumeData.sections.experience.slice(0, 5).map((exp, i) => (
                        <li key={i} className="pl-4 border-l-2 border-gray-200">{exp}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">未找到工作经历信息</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">项目经历</h3>
                  {resumeData.sections.projects && resumeData.sections.projects.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {resumeData.sections.projects.slice(0, 5).map((project, i) => (
                        <li key={i} className="pl-4 border-l-2 border-gray-200">{project}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">未找到项目经历信息</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">技能</h3>
                  {resumeData.sections.skills && resumeData.sections.skills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {resumeData.sections.skills.slice(0, 10).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">未找到技能信息</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>尚未上传简历</p>
                <p className="text-sm">上传简历后，AI将自动分析并提取关键信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>下一步</CardTitle>
          <CardDescription>
            {resumeData ? '简历已上传！现在您可以导入面试问题或生成AI驱动的问题。' : '上传简历后，您可以导入面试问题或生成AI驱动的问题。'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild disabled={!resumeData}>
            <a href="/questions">导入问题</a>
          </Button>
          <Button variant="outline" asChild disabled={!resumeData}>
            <a href="/generate">生成AI问题</a>
          </Button>
          <Button
            variant="ghost"
            onClick={handleDownloadAnalysis}
            disabled={!resumeData}
          >
            <Download className="h-4 w-4 mr-2" />
            下载分析
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}