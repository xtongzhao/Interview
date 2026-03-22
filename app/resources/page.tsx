"use client";

import { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus
} from "lucide-react";
import { useInterviewData, ResourceType } from "@/hooks/useInterviewData";
import { KnowledgeCategory, CategoryConfig } from "@/lib/knowledgeCategories";

export default function ResourcesPage() {
  const {
    resources,
    isLoading,
    addResource,
    deleteResource,
    importResourcesFromFiles,
    processingResource,
  } = useInterviewData();

  const [activeTab, setActiveTab] = useState<ResourceType | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState<ResourceType>('text');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 资源类型配置
  const resourceTypeConfig: Record<ResourceType, { label: string; icon: React.ReactNode; color: string }> = {
    resume: { label: '简历', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
    image: { label: '图片', icon: <ImageIcon className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
    text: { label: '文本', icon: <FileType className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700' },
    jd: { label: '职位描述', icon: <Briefcase className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
    other: { label: '其他', icon: <FileText className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
  };

  // 过滤资源
  const filteredResources = resources.filter(resource => {
    if (activeTab !== 'all' && resource.type !== activeTab) return false;
    if (searchText && !resource.title.toLowerCase().includes(searchText.toLowerCase()) &&
        !resource.description?.toLowerCase().includes(searchText.toLowerCase())) {
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
    fileInputRef.current?.click();
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

  // 处理上传
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
        <h1 className="text-3xl font-bold">面试资源库</h1>
        <p className="text-muted-foreground">
          管理您的面试资源：简历、小红书图片、职位描述、笔记等。所有资源将被解析并存入知识库，用于智能面试准备。
        </p>
      </div>

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
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
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
              上传或创建面试资源，支持多种格式
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
                    <SelectItem value="image">图片 (小红书截图等)</SelectItem>
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

      {/* 资源类型标签 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          全部 ({resources.length})
        </Button>
        {Object.entries(resourceTypeConfig).map(([type, config]) => (
          <Button
            key={type}
            variant={activeTab === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(type as ResourceType)}
            className={activeTab === type ? config.color : ''}
          >
            <span className="mr-1">{config.icon}</span>
            {config.label} ({resourcesByType[type as ResourceType] || 0})
          </Button>
        ))}
      </div>

      {/* 资源列表 */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">列表视图</TabsTrigger>
          <TabsTrigger value="grid">网格视图</TabsTrigger>
          <TabsTrigger value="timeline">时间线</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
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
                                <Badge className={`bg-${categoryConfig.color}-100 text-${categoryConfig.color}-700`}>
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            查看
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteResource(resource.id, resource.title)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grid">
          <Card>
            <CardHeader>
              <CardTitle>网格视图</CardTitle>
              <CardDescription>以网格形式展示资源（开发中）</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                网格视图正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>时间线视图</CardTitle>
              <CardDescription>按时间顺序查看资源（开发中）</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                时间线视图正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 快速操作卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用操作和快捷入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
              <a href="/resume">
                <Upload className="h-6 w-6 mb-2" />
                <span>上传简历</span>
                <span className="text-xs text-muted-foreground mt-1">快速解析个人资料</span>
              </a>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
              <a href="/applications">
                <Briefcase className="h-6 w-6 mb-2" />
                <span>管理投递</span>
                <span className="text-xs text-muted-foreground mt-1">查看职位投递记录</span>
              </a>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
              <a href="/questions">
                <FileText className="h-6 w-6 mb-2" />
                <span>面试问题</span>
                <span className="text-xs text-muted-foreground mt-1">管理面试问题库</span>
              </a>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
              <a href="/generate">
                <FileType className="h-6 w-6 mb-2" />
                <span>生成问题</span>
                <span className="text-xs text-muted-foreground mt-1">AI生成面试问题</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}