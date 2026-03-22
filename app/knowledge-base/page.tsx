"use client";

import { useState, useEffect, useRef, Suspense } from 'react';

// 注意：在客户端组件中，页面配置可能被忽略
// 我们通过避免使用 useSearchParams 来防止预渲染错误
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileType,
  Briefcase,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Save,
  X,
  Star,
  Copy,
  BookOpen,
  FolderOpen,
} from "lucide-react";
import { useInterviewData, ResourceType, InterviewResource } from "@/hooks/useInterviewData";
import { KnowledgeCategory, CategoryConfig } from "@/lib/knowledgeCategories";
import { resourceProcessor } from "@/lib/resourceProcessor";

function KnowledgeBasePageContent() {
  // 使用 useState 和 useEffect 替代 useSearchParams 以避免预渲染错误
  const [activeTab, setActiveTab] = useState<'resources' | 'knowledge'>('resources');

  // 资源管理相关状态和函数
  const {
    resources,
    isLoading,
    addResource,
    updateResource,
    deleteResource,
    importResourcesFromFiles,
    processingResource,
  } = useInterviewData();

  // 当URL参数变化时更新活动标签页
  useEffect(() => {
    // 仅在客户端执行
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');

    if (tabParam === 'knowledge' || tabParam === 'resources') {
      setActiveTab(tabParam as any);
    } else if (tabParam === 'questions') {
      // 向后兼容：旧questions参数重定向到knowledge
      setActiveTab('knowledge');
    }
    // 如果没有tab参数，使用默认值 'resources'，已经是默认值
  }, []); // 空依赖数组，仅在组件挂载时执行一次

  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | 'all'>('all');
  const [searchResourceText, setSearchResourceText] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState<ResourceType>('text');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 资源类型配置
  const resourceTypeConfig: Record<ResourceType, { label: string; icon: React.ReactNode; color: string }> = {
    resume: { label: '简历', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
    image: { label: '图片', icon: <ImageIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
    text: { label: '文本', icon: <FileType className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700' },
    jd: { label: '职位描述', icon: <Briefcase className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
    other: { label: '其他', icon: <FileText className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
  };

  // 检查内容是否有效（不是占位符或标题）
  const isValidContent = (content: string | undefined): boolean => {
    if (!content || content.trim().length === 0) return false;
    // 排除占位符文本
    if (content.includes('[图片OCR识别失败:') ||
        content.includes('[OCR placeholder for:') ||
        content.includes('[已有图片内容，但需要重新上传以进行OCR]')) {
      return false;
    }
    // 内容长度至少10个字符
    return content.trim().length >= 10;
  };

  // 过滤资源
  const filteredResources = resources.filter(resource => {
    if (resourceTypeFilter !== 'all' && resource.type !== resourceTypeFilter) return false;
    if (searchResourceText && !resource.title.toLowerCase().includes(searchResourceText.toLowerCase()) &&
      !resource.description?.toLowerCase().includes(searchResourceText.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 按类型分组统计
  const resourcesByType = resources.reduce((acc, resource) => {
    acc[resource.type] = (acc[resource.type] || 0) + 1;
    return acc;
  }, {} as Record<ResourceType, number>);


  // 处理文件选择
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingFiles(files);

    // 自动设置标题（使用文件名）
    if (files.length === 1 && !uploadTitle) {
      setUploadTitle(files[0].name.replace(/\.[^/.]+$/, "")); // 移除扩展名
    }
  };

  // 处理资源上传
  const handleUpload = async () => {
    if (uploadingFiles.length === 0 && !uploadTitle.trim()) {
      alert('请选择文件或输入标题');
      return;
    }

    try {
      if (uploadingFiles.length > 0) {
        // 批量上传文件
        const results = await importResourcesFromFiles(uploadingFiles, uploadType);

        // 检查结果
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        if (successCount > 0) {
          alert(`成功上传 ${successCount} 个资源${errorCount > 0 ? `，${errorCount} 个失败` : ''}`);
        } else {
          alert('上传失败，请检查文件格式和网络连接');
        }
      } else {
        // 手动创建文本资源
        await addResource(uploadType, uploadTitle, undefined, uploadDescription);
        alert('资源创建成功');
      }

      // 重置表单
      resetUploadForm();
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 重置上传表单
  const resetUploadForm = () => {
    setUploadingFiles([]);
    setUploadTitle('');
    setUploadDescription('');
    setUploadType('text');
    setShowUploadForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理删除资源
  const handleDeleteResource = async (resourceId: string, resourceTitle: string) => {
    if (confirm(`确定要删除资源 "${resourceTitle}" 吗？`)) {
      await deleteResource(resourceId);
    }
  };

  // 开始编辑资源内容
  const handleStartEdit = (resource: InterviewResource) => {
    setEditingResourceId(resource.id);
    setEditedContent(resource.content || '');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingResourceId(null);
    setEditedContent('');
  };

  // 保存编辑的内容
  const handleSaveEdit = async (resource: InterviewResource) => {
    if (!editedContent.trim()) {
      alert('内容不能为空');
      return;
    }

    setIsSaving(true);
    try {
      // 1. 在客户端更新资源内容
      const updatedResource: InterviewResource = {
        ...resource,
        content: editedContent,
        updatedAt: new Date(),
        status: 'processed',
        metadata: {
          ...resource.metadata,
          ocrResult: resource.metadata?.ocrResult ? {
            ...resource.metadata.ocrResult,
            // 保留OCR置信度等信息，只更新内容
          } : undefined
        }
      };

      // 2. 保存到本地存储
      await updateResource(updatedResource);

      // 3. 更新知识库中的知识块
      const updateResult = await resourceProcessor.updateResourceText(
        resource.id,
        editedContent,
        {
          resourceType: resource.type,
        }
      );

      // 4. 重置编辑状态
      setEditingResourceId(null);
      setEditedContent('');

      // 5. 显示成功消息（包含知识库更新信息）
      const knowledgeMsg = updateResult.success
        ? `，知识库已更新（删除${updateResult.deletedCount}个旧块，新增${updateResult.chunks.length}个新块）`
        : '，但知识库更新失败';
      alert(`内容已保存${knowledgeMsg}！`);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  // 上传资源到知识库（显式操作）
  const handleUploadToKnowledgeBase = async (resource: InterviewResource) => {
    console.log('开始上传资源到知识库:', resource.id, resource.title, resource.type);

    if (!resource.content) {
      console.warn('资源没有内容:', resource.id);
      alert('资源没有可上传的内容');
      return;
    }

    if (resource.content.trim().length === 0) {
      console.warn('资源内容为空:', resource.id);
      alert('资源内容为空，请先编辑或等待资源处理完成');
      return;
    }

    try {
      console.log('调用resourceProcessor.updateResourceText, 内容长度:', resource.content.length);
      const result = await resourceProcessor.updateResourceText(
        resource.id,
        resource.content,
        {
          resourceType: resource.type,
        }
      );

      console.log('上传结果:', result);

      if (result.success) {
        alert(`资源已上传到知识库！新增 ${result.chunks.length} 个知识块。`);
        // 可以在这里更新资源状态或触发重新加载
      } else {
        console.error('上传失败:', result.error);
        alert('上传失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('上传到知识库失败:', error);
      alert('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 获取分类配置
  const getCategoryConfig = (category: KnowledgeCategory) => {
    return CategoryConfig[category] || { name: '未知', color: 'gray', icon: '❓' };
  };

  // 获取资源状态徽章
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
      processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-700' },
      processed: { label: '已处理', color: 'bg-green-100 text-green-700' },
      error: { label: '错误', color: 'bg-red-100 text-red-700' },
    }[status] || { label: status, color: 'bg-gray-100 text-gray-700' };

    return (
      <Badge className={`text-xs ${statusConfig.color}`}>
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">面试资源知识库</h1>
        <p className="text-muted-foreground">
          统一管理您的面试资源和知识库内容，所有资源将被解析并存入知识库，用于智能面试准备。
        </p>
      </div>

      {/* 主标签页 */}
      <Tabs defaultValue="resources" value={activeTab} onValueChange={(v) => setActiveTab(v as 'resources' | 'knowledge')}>
        <TabsList>
          <TabsTrigger value="resources">
            <FolderOpen className="h-4 w-4 mr-2" />
            资源管理 ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <BookOpen className="h-4 w-4 mr-2" />
            知识库 ({resources.filter(r => isValidContent(r.content)).length})
          </TabsTrigger>
        </TabsList>

        {/* 资源管理标签页 */}
        <TabsContent value="resources" className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总资源数</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resources.length}</div>
                <p className="text-xs text-muted-foreground">所有类型资源</p>
              </CardContent>
            </Card>
            {Object.entries(resourceTypeConfig).map(([type, config]) => (
              <Card key={type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  {config.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resourcesByType[type as ResourceType] || 0}</div>
                  <p className="text-xs text-muted-foreground">{config.label}资源</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 控制栏 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索资源标题或描述..."
                  value={searchResourceText}
                  onChange={(e) => setSearchResourceText(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={resourceTypeFilter} onValueChange={(v: ResourceType | 'all') => setResourceTypeFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="筛选类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(resourceTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center">
                        {config.icon}
                        <span className="ml-2">{config.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowUploadForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                上传资源
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出数据
              </Button>
            </div>
          </div>

          {/* 上传表单 */}
          {showUploadForm && (
            <Card>
              <CardHeader>
                <CardTitle>上传资源</CardTitle>
                <CardDescription>
                  上传或创建面试资源，支持多种格式：图片（OCR）、文字、PDF、Word
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">资源类型 *</label>
                    <Select value={uploadType} onValueChange={(value: ResourceType) => setUploadType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resume">简历 (PDF/DOC/DOCX/TXT)</SelectItem>
                        <SelectItem value="image">图片 (支持OCR识别)</SelectItem>
                        <SelectItem value="text">文本笔记</SelectItem>
                        <SelectItem value="jd">职位描述 (JD)</SelectItem>
                        <SelectItem value="other">其他资源</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">资源标题 *</label>
                    <Input
                      placeholder="例如：我的简历、小红书笔记、面试问题..."
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">资源描述 (可选)</label>
                  <Textarea
                    placeholder="描述资源内容..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {uploadType === 'text' ? '文本内容 (可选)' : '上传文件'}
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple={uploadType !== 'resume'}
                    accept={
                      uploadType === 'resume'
                        ? '.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'
                        : uploadType === 'image'
                        ? 'image/*'
                        : uploadType === 'text'
                        ? '.txt,.md,.json'
                        : '*/*'
                    }
                    className="hidden"
                  />

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {uploadingFiles.length > 0 ? (
                      <div className="space-y-2">
                        <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                        <p className="font-medium">已选择 {uploadingFiles.length} 个文件</p>
                        <ul className="text-sm text-muted-foreground">
                          {uploadingFiles.slice(0, 3).map((file, index) => (
                            <li key={index} className="truncate">{file.name} ({Math.round(file.size / 1024)}KB)</li>
                          ))}
                          {uploadingFiles.length > 3 && (
                            <li>...还有 {uploadingFiles.length - 3} 个文件</li>
                          )}
                        </ul>
                        <Button variant="outline" size="sm" onClick={() => setUploadingFiles([])}>
                          清除文件
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="mb-2">
                          {uploadType === 'text'
                            ? '点击输入文本内容，或上传文本文件'
                            : `拖放${resourceTypeConfig[uploadType].label}文件至此，或点击浏览`}
                        </p>
                        <Button onClick={handleFileSelect} variant="outline">
                          选择文件
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          {uploadType === 'resume' && '支持 PDF, DOC, DOCX, TXT 格式，最大10MB'}
                          {uploadType === 'image' && '支持 JPG, PNG, GIF 等图片格式，最大5MB'}
                          {uploadType === 'text' && '支持 TXT, MD, JSON 等文本格式'}
                          {uploadType === 'jd' && '支持多种文档格式'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetUploadForm}>
                    取消
                  </Button>
                  <Button onClick={handleUpload} disabled={processingResource !== null}>
                    {processingResource ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      '上传资源'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 资源列表 */}
          {isLoading.resources ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">加载资源中...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无资源</p>
                <p className="text-sm mt-1">点击"上传资源"开始构建您的面试知识库</p>
                <Button className="mt-4" onClick={() => setShowUploadForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  上传第一个资源
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResources.map((resource) => {
                const typeConfig = resourceTypeConfig[resource.type];
                const categoryConfig = getCategoryConfig(resource.category);

                return (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                              {typeConfig.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold">{resource.title}</h3>
                                <Badge className={typeConfig.color}>
                                  {typeConfig.icon}
                                  <span className="ml-1">{typeConfig.label}</span>
                                </Badge>
                                {getStatusBadge(resource.status)}
                                <Badge className={categoryConfig.badgeClass}>
                                  {categoryConfig.icon} {categoryConfig.name}
                                </Badge>
                              </div>

                              {resource.description && (
                                <p className="text-muted-foreground mb-2">{resource.description}</p>
                              )}

                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  上传时间: {new Date(resource.createdAt).toLocaleDateString()}
                                </span>
                                {resource.processedAt && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    处理时间: {new Date(resource.processedAt).toLocaleDateString()}
                                  </span>
                                )}
                                {resource.content && (
                                  <span className="flex items-center gap-1">
                                    内容长度: {resource.content.length} 字符
                                  </span>
                                )}
                              </div>

                              {resource.tags && resource.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {resource.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex gap-2">
                          {/* 上传到知识库按钮 */}
                          {resource.status === 'processed' && resource.content && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUploadToKnowledgeBase(resource)}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              上传到知识库
                            </Button>
                          )}

                          {editingResourceId === resource.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSaveEdit(resource)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                              >
                                <X className="h-3 w-3 mr-1" />
                                取消
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(resource)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                编辑
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteResource(resource.id, resource.title)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                删除
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 资源内容展示和编辑区域 */}
                      {(resource.content || editingResourceId === resource.id) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">内容:</h4>
                            {resource.metadata?.ocrResult?.confidence && (
                              <span className="text-xs text-gray-500">
                                OCR置信度: {(resource.metadata.ocrResult.confidence * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>

                          {editingResourceId === resource.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                rows={6}
                                className="w-full font-mono text-sm"
                                placeholder="编辑内容..."
                              />
                              <p className="text-xs text-gray-500">
                                提示: 编辑后内容将更新到知识库中，用于后续面试问题生成。
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
                                {resource.content}
                              </div>
                              {resource.content && resource.content.length > 300 && (
                                <p className="text-xs text-gray-500">
                                  内容长度: {resource.content.length} 字符
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 知识库标签页 - 展示已上传资源的文本内容 */}
        <TabsContent value="knowledge" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">知识库内容</h2>
            <p className="text-muted-foreground">
              展示所有已解析的纯文本内容集合，这些文字资料将用于智能生成面试问题和复习准备。
            </p>
          </div>


          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索知识库内容..."
              value={searchResourceText}
              onChange={(e) => setSearchResourceText(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 资源内容列表 */}
          {isLoading.resources ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">加载资源内容中...</p>
            </div>
          ) : filteredResources.filter(r => isValidContent(r.content)).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无资源内容</p>
                <p className="text-sm mt-1">
                  {resources.length === 0
                    ? '请先上传资源到"资源管理"页面'
                    : '当前没有包含文本内容的资源，请上传或处理资源'}
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('resources')}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  前往资源管理
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResources
                .filter(r => isValidContent(r.content))
                .map((resource) => {
                  const typeConfig = resourceTypeConfig[resource.type];
                  const categoryConfig = getCategoryConfig(resource.category);
                  const contentPreview = resource.content!.length > 300
                    ? resource.content!.substring(0, 300) + '...'
                    : resource.content!;

                  return (
                    <Card key={resource.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                            {resource.description && (
                              <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                            )}
                          </div>

                          {/* 内容预览 */}
                          <div className="pt-3 border-t">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
                              {contentPreview}
                            </div>
                            {resource.content!.length > 300 && (
                              <p className="text-xs text-gray-500 mt-2">
                                完整内容: {resource.content!.length} 字符
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}

          {/* 操作提示 */}
          <Card>
            <CardHeader>
              <CardTitle>如何使用知识库</CardTitle>
              <CardDescription>
                知识库内容用于智能生成面试问题和复习准备
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-700 rounded-full p-1 mr-2 mt-0.5">
                    <Plus className="h-3 w-3" />
                  </div>
                  <span>在"资源管理"页面上传简历、图片、文档等资源</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 text-green-700 rounded-full p-1 mr-2 mt-0.5">
                    <FileText className="h-3 w-3" />
                  </div>
                  <span>系统自动解析资源内容并提取文本，存储到知识库</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-yellow-100 text-yellow-700 rounded-full p-1 mr-2 mt-0.5">
                    <BookOpen className="h-3 w-3" />
                  </div>
                  <span>在"知识生成"页面使用知识库内容生成个性化面试问题</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">面试资源知识库</h1>
          <p className="text-muted-foreground">
            统一管理您的面试资源和知识库内容，所有资源将被解析并存入知识库，用于智能面试准备。
          </p>
        </div>
        <div className="text-center py-12">
          <p>加载中...</p>
        </div>
      </div>
    }>
      <KnowledgeBasePageContent />
    </Suspense>
  );
}