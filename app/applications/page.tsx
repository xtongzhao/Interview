"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useInterviewData, ApplicationStatus, ApplicationType } from "@/hooks/useInterviewData";
import type { RecruitmentWebsite } from "@/lib/interviewModels";
import { useState, useEffect } from "react";
import { Plus, Search, Filter, Calendar, Building, Briefcase, Download, Upload, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, Users, ExternalLink, Star, Globe, Settings } from "lucide-react";

export default function ApplicationsPage() {
  const {
    applications,
    websites,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication,
    getApplicationsByStatus,
    incrementWebsiteVisitCount,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    toggleWebsiteFavorite,
  } = useInterviewData();

  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [showWebsiteManager, setShowWebsiteManager] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<string | null>(null);
  const [newWebsiteForm, setNewWebsiteForm] = useState({
    name: '',
    url: '',
    description: '',
    category: 'job_board' as RecruitmentWebsite['category'],
    requiresLogin: true,
  });

  // 新应用表单状态
  const [newApp, setNewApp] = useState({
    company: '',
    position: '',
    businessUnit: '',
    location: '',
    applicationType: 'fulltime' as ApplicationType,
    status: 'draft' as ApplicationStatus,
    jdContent: '',
    notes: '',
  });

  // 状态徽章颜色映射
  const statusColors: Record<ApplicationStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    applied: 'bg-blue-100 text-blue-700',
    interviewing: 'bg-yellow-100 text-yellow-700',
    offer: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    accepted: 'bg-purple-100 text-purple-700',
    withdrawn: 'bg-gray-100 text-gray-700',
  };

  // 状态徽章图标映射
  const statusIcons: Record<ApplicationStatus, React.ReactNode> = {
    draft: <Clock className="h-3 w-3" />,
    applied: <CheckCircle className="h-3 w-3" />,
    interviewing: <Users className="h-3 w-3" />,
    offer: <Briefcase className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
    accepted: <CheckCircle className="h-3 w-3" />,
    withdrawn: <XCircle className="h-3 w-3" />,
  };

  // 处理招聘官网点击
  const handleWebsiteClick = async (websiteId: string, url: string) => {
    try {
      // 记录访问次数
      await incrementWebsiteVisitCount(websiteId);
      // 在新标签页打开链接
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error recording website visit:', error);
      // 即使记录失败也打开链接
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 过滤应用
  const filteredApplications = applications.filter(app => {
    if (activeTab !== 'all' && app.status !== activeTab) return false;
    if (searchText && !app.company.toLowerCase().includes(searchText.toLowerCase()) &&
        !app.position.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 按状态分组
  const applicationsByStatus = {
    all: applications,
    draft: getApplicationsByStatus('draft'),
    applied: getApplicationsByStatus('applied'),
    interviewing: getApplicationsByStatus('interviewing'),
    offer: getApplicationsByStatus('offer'),
    rejected: getApplicationsByStatus('rejected'),
    accepted: getApplicationsByStatus('accepted'),
    withdrawn: getApplicationsByStatus('withdrawn'),
  };

  // 重置表单
  const resetForm = () => {
    setNewApp({
      company: '',
      position: '',
      businessUnit: '',
      location: '',
      applicationType: 'fulltime',
      status: 'draft',
      jdContent: '',
      notes: '',
    });
    setEditingApp(null);
    setShowNewForm(false);
  };

  // 处理保存
  const handleSave = async () => {
    if (!newApp.company.trim() || !newApp.position.trim()) {
      alert('请填写公司和职位名称');
      return;
    }

    if (editingApp) {
      // 更新现有应用
      const app = applications.find(a => a.id === editingApp);
      if (app) {
        await updateApplication({
          ...app,
          company: newApp.company,
          position: newApp.position,
          businessUnit: newApp.businessUnit,
          location: newApp.location,
          applicationType: newApp.applicationType,
          status: newApp.status,
          jdContent: newApp.jdContent,
          notes: newApp.notes,
          updatedAt: new Date(),
        });
      }
    } else {
      // 创建新应用
      await addApplication(newApp.company, newApp.position, newApp.applicationType);
    }

    resetForm();
  };

  // 处理编辑
  const handleEdit = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (app) {
      setNewApp({
        company: app.company,
        position: app.position,
        businessUnit: app.businessUnit || '',
        location: app.location || '',
        applicationType: app.applicationType,
        status: app.status,
        jdContent: app.jdContent || '',
        notes: app.notes,
      });
      setEditingApp(appId);
      setShowNewForm(true);
    }
  };

  // 处理删除
  const handleDelete = async (appId: string) => {
    if (confirm('确定要删除这个投递记录吗？')) {
      await deleteApplication(appId);
    }
  };

  // 统计数据
  const stats = {
    total: applications.length,
    byStatus: Object.entries(applicationsByStatus).reduce((acc, [status, apps]) => {
      if (status !== 'all') {
        acc[status as ApplicationStatus] = apps.length;
      }
      return acc;
    }, {} as Record<ApplicationStatus, number>),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">投递管理</h1>
        <p className="text-muted-foreground">
          管理您的职位投递记录，跟踪进度，记录面试经历。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总投递数</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">累计投递职位</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">面试中</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.interviewing || 0}</div>
            <p className="text-xs text-muted-foreground">正在进行面试</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收到Offer</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.byStatus.offer || 0) + (stats.byStatus.accepted || 0)}</div>
            <p className="text-xs text-muted-foreground">成功获得机会</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ?
                Math.round(((stats.byStatus.offer || 0) + (stats.byStatus.accepted || 0)) / stats.total * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">投递到Offer转化率</p>
          </CardContent>
        </Card>
      </div>

      {/* 控制栏 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索公司或职位..."
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
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增投递
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 新增/编辑表单 */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingApp ? '编辑投递记录' : '新增投递记录'}</CardTitle>
            <CardDescription>
              填写职位投递信息，便于后续跟踪和管理
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">公司名称 *</label>
                <Input
                  placeholder="例如：阿里巴巴"
                  value={newApp.company}
                  onChange={(e) => setNewApp({...newApp, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">职位名称 *</label>
                <Input
                  placeholder="例如：AI产品经理"
                  value={newApp.position}
                  onChange={(e) => setNewApp({...newApp, position: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">业务部门</label>
                <Input
                  placeholder="例如：淘宝直播"
                  value={newApp.businessUnit}
                  onChange={(e) => setNewApp({...newApp, businessUnit: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">工作地点</label>
                <Input
                  placeholder="例如：杭州"
                  value={newApp.location}
                  onChange={(e) => setNewApp({...newApp, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">职位类型</label>
                <Select
                  value={newApp.applicationType}
                  onValueChange={(value: ApplicationType) => setNewApp({...newApp, applicationType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">暑期实习</SelectItem>
                    <SelectItem value="fulltime">全职</SelectItem>
                    <SelectItem value="parttime">兼职</SelectItem>
                    <SelectItem value="contract">合同制</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">当前状态</label>
                <Select
                  value={newApp.status}
                  onValueChange={(value: ApplicationStatus) => setNewApp({...newApp, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="applied">已投递</SelectItem>
                    <SelectItem value="interviewing">面试中</SelectItem>
                    <SelectItem value="offer">收到Offer</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                    <SelectItem value="accepted">已接受</SelectItem>
                    <SelectItem value="withdrawn">已撤回</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">职位描述(JD)</label>
              <Textarea
                placeholder="粘贴职位描述或要求..."
                value={newApp.jdContent}
                onChange={(e) => setNewApp({...newApp, jdContent: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">备注</label>
              <Textarea
                placeholder="记录投递的特殊要求、内推人等信息..."
                value={newApp.notes}
                onChange={(e) => setNewApp({...newApp, notes: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingApp ? '更新记录' : '创建记录'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 状态标签 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          全部 ({applications.length})
        </Button>
        {Object.entries(statusColors).map(([status, color]) => (
          <Button
            key={status}
            variant={activeTab === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(status as ApplicationStatus)}
          >
            <span className="mr-1">{statusIcons[status as ApplicationStatus]}</span>
            {status === 'draft' && '草稿'}
            {status === 'applied' && '已投递'}
            {status === 'interviewing' && '面试中'}
            {status === 'offer' && '收到Offer'}
            {status === 'rejected' && '已拒绝'}
            {status === 'accepted' && '已接受'}
            {status === 'withdrawn' && '已撤回'}
            ({applicationsByStatus[status as ApplicationStatus].length})
          </Button>
        ))}
      </div>

      {/* 投递列表 */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">列表视图</TabsTrigger>
          <TabsTrigger value="kanban">看板视图</TabsTrigger>
          <TabsTrigger value="calendar">日历视图</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading.applications ? (
            <div className="text-center py-8">
              <p>加载中...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无投递记录</p>
                <p className="text-sm mt-1">点击"新增投递"开始记录您的求职历程</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredApplications.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{app.company}</h3>
                              <Badge className={statusColors[app.status]}>
                                {statusIcons[app.status]}
                                <span className="ml-1">
                                  {app.status === 'draft' && '草稿'}
                                  {app.status === 'applied' && '已投递'}
                                  {app.status === 'interviewing' && '面试中'}
                                  {app.status === 'offer' && '收到Offer'}
                                  {app.status === 'rejected' && '已拒绝'}
                                  {app.status === 'accepted' && '已接受'}
                                  {app.status === 'withdrawn' && '已撤回'}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-2">{app.position}</p>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              {app.businessUnit && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {app.businessUnit}
                                </span>
                              )}
                              {app.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {app.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                投递时间: {new Date(app.appliedDate).toLocaleDateString()}
                              </span>
                            </div>
                            {app.notes && (
                              <p className="mt-3 text-sm bg-gray-50 p-2 rounded">
                                {app.notes.length > 100 ? `${app.notes.substring(0, 100)}...` : app.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(app.id)}>
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(app.id)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <Card>
            <CardHeader>
              <CardTitle>看板视图</CardTitle>
              <CardDescription>按状态分类的看板视图（开发中）</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                看板视图正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>日历视图</CardTitle>
              <CardDescription>按时间线查看投递进度（开发中）</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                日历视图正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 招聘官网快捷链接 */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>招聘官网快捷链接</CardTitle>
            <CardDescription>
              一键跳转到常用招聘网站，避免每次都要查询和登录
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWebsiteManager(true)}
            className="mt-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            管理
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading.websites ? (
            <div className="text-center py-4">
              <p>加载中...</p>
            </div>
          ) : websites.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暂无招聘网站数据</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {websites
                .sort((a, b) => {
                  // 先按收藏排序
                  if (a.metadata.isFavorite && !b.metadata.isFavorite) return -1;
                  if (!a.metadata.isFavorite && b.metadata.isFavorite) return 1;
                  // 再按访问次数排序
                  const aVisits = a.metadata.visitCount || 0;
                  const bVisits = b.metadata.visitCount || 0;
                  return bVisits - aVisits;
                })
                .slice(0, 8) // 显示前8个
                .map((website) => (
                  <Button
                    key={website.id}
                    variant="outline"
                    className="flex flex-col h-auto py-3 px-4 text-left items-start justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => handleWebsiteClick(website.id, website.url)}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        {website.metadata.isFavorite ? (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm truncate">{website.name}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate w-full">
                      {website.description || website.url.replace(/^https?:\/\//, '')}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span>访问:</span>
                        <span>{website.metadata.visitCount || 0}</span>
                      </span>
                      {website.requiresLogin && (
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                          需登录
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <span className="text-xs text-muted-foreground mt-1">更新个人资料</span>
              </a>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
              <a href="/questions">
                <Plus className="h-6 w-6 mb-2" />
                <span>添加面试问题</span>
                <span className="text-xs text-muted-foreground mt-1">准备面试</span>
              </a>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
              <a href="/interview">
                <Users className="h-6 w-6 mb-2" />
                <span>模拟面试</span>
                <span className="text-xs text-muted-foreground mt-1">练习面试技巧</span>
              </a>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4" asChild>
              <a href="/playback">
                <Calendar className="h-6 w-6 mb-2" />
                <span>记录面试复盘</span>
                <span className="text-xs text-muted-foreground mt-1">总结经验教训</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 招聘网站管理模态框 */}
      {showWebsiteManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between border-b">
              <div>
                <CardTitle>招聘网站管理</CardTitle>
                <CardDescription>
                  管理您的招聘网站快捷链接，可以添加、编辑、删除网站
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowWebsiteManager(false);
                  setEditingWebsite(null);
                  setNewWebsiteForm({
                    name: '',
                    url: '',
                    description: '',
                    category: 'job_board' as RecruitmentWebsite['category'],
                    requiresLogin: true,
                  });
                }}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* 添加/编辑表单 */}
                <div className="space-y-4">
                  <h3 className="font-medium">
                    {editingWebsite ? '编辑网站' : '添加新网站'}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="website-name">网站名称 *</Label>
                      <Input
                        id="website-name"
                        placeholder="例如：BOSS直聘"
                        value={newWebsiteForm.name}
                        onChange={(e) => setNewWebsiteForm({...newWebsiteForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website-url">网站URL *</Label>
                      <Input
                        id="website-url"
                        placeholder="例如：https://www.zhipin.com"
                        value={newWebsiteForm.url}
                        onChange={(e) => setNewWebsiteForm({...newWebsiteForm, url: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website-category">网站类型</Label>
                      <Select
                        value={newWebsiteForm.category}
                        onValueChange={(value: RecruitmentWebsite['category']) =>
                          setNewWebsiteForm({...newWebsiteForm, category: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="job_board">招聘平台</SelectItem>
                          <SelectItem value="company_portal">公司官网</SelectItem>
                          <SelectItem value="social_media">社交平台</SelectItem>
                          <SelectItem value="government">政府网站</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website-requires-login">是否需要登录</Label>
                      <Select
                        value={newWebsiteForm.requiresLogin ? 'yes' : 'no'}
                        onValueChange={(value) =>
                          setNewWebsiteForm({...newWebsiteForm, requiresLogin: value === 'yes'})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">需要登录</SelectItem>
                          <SelectItem value="no">无需登录</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="website-description">网站描述（可选）</Label>
                      <Input
                        id="website-description"
                        placeholder="例如：国内领先的互联网招聘平台"
                        value={newWebsiteForm.description}
                        onChange={(e) => setNewWebsiteForm({...newWebsiteForm, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {editingWebsite && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingWebsite(null);
                          setNewWebsiteForm({
                            name: '',
                            url: '',
                            description: '',
                            category: 'job_board' as RecruitmentWebsite['category'],
                            requiresLogin: true,
                          });
                        }}
                      >
                        取消编辑
                      </Button>
                    )}
                    <Button
                      onClick={async () => {
                        if (!newWebsiteForm.name.trim() || !newWebsiteForm.url.trim()) {
                          alert('请填写网站名称和URL');
                          return;
                        }
                        try {
                          if (editingWebsite) {
                            // 更新现有网站
                            const website = websites.find(w => w.id === editingWebsite);
                            if (website) {
                              const updatedWebsite = {
                                ...website,
                                name: newWebsiteForm.name,
                                url: newWebsiteForm.url,
                                description: newWebsiteForm.description,
                                category: newWebsiteForm.category,
                                requiresLogin: newWebsiteForm.requiresLogin,
                                updatedAt: new Date(),
                              };
                              await updateWebsite(updatedWebsite);
                            }
                          } else {
                            // 添加新网站
                            await addWebsite(
                              newWebsiteForm.name,
                              newWebsiteForm.url,
                              newWebsiteForm.category,
                              newWebsiteForm.description
                            );
                          }
                          // 重置表单
                          setNewWebsiteForm({
                            name: '',
                            url: '',
                            description: '',
                            category: 'job_board' as RecruitmentWebsite['category'],
                            requiresLogin: true,
                          });
                          setEditingWebsite(null);
                        } catch (error) {
                          console.error('Error saving website:', error);
                          alert('保存失败，请重试');
                        }
                      }}
                    >
                      {editingWebsite ? '更新网站' : '添加网站'}
                    </Button>
                  </div>
                </div>

                {/* 网站列表 */}
                <div className="space-y-4">
                  <h3 className="font-medium">已有网站 ({websites.length})</h3>
                  {websites.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>暂无招聘网站数据</p>
                      <p className="text-sm mt-1">请添加第一个招聘网站</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {websites
                        .sort((a, b) => {
                          // 按收藏和访问次数排序
                          if (a.metadata.isFavorite && !b.metadata.isFavorite) return -1;
                          if (!a.metadata.isFavorite && b.metadata.isFavorite) return 1;
                          const aVisits = a.metadata.visitCount || 0;
                          const bVisits = b.metadata.visitCount || 0;
                          return bVisits - aVisits;
                        })
                        .map((website) => (
                          <div
                            key={website.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleWebsiteFavorite(website.id)}
                                className="p-1 hover:bg-accent rounded"
                              >
                                {website.metadata.isFavorite ? (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                ) : (
                                  <Star className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{website.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {website.category === 'job_board' && '招聘平台'}
                                    {website.category === 'company_portal' && '公司官网'}
                                    {website.category === 'social_media' && '社交平台'}
                                    {website.category === 'government' && '政府网站'}
                                    {website.category === 'other' && '其他'}
                                  </Badge>
                                  {website.requiresLogin && (
                                    <Badge variant="secondary" className="text-xs">
                                      需登录
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {website.description || website.url}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>访问: {website.metadata.visitCount || 0}</span>
                                  <span>
                                    收藏: {website.metadata.isFavorite ? '是' : '否'}
                                  </span>
                                  <span>
                                    创建: {new Date(website.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingWebsite(website.id);
                                  setNewWebsiteForm({
                                    name: website.name,
                                    url: website.url,
                                    description: website.description || '',
                                    category: website.category,
                                    requiresLogin: website.requiresLogin,
                                  });
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                编辑
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (confirm(`确定要删除 "${website.name}" 吗？`)) {
                                    await deleteWebsite(website.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                删除
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}