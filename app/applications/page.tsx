"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useInterviewData, ApplicationStatus, ApplicationType } from "@/hooks/useInterviewData";
import { useState, useEffect } from "react";
import { Plus, Search, Filter, Calendar, Building, Briefcase, Download, Upload, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, Users } from "lucide-react";

export default function ApplicationsPage() {
  const {
    applications,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication,
    getApplicationsByStatus,
  } = useInterviewData();

  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingApp, setEditingApp] = useState<string | null>(null);

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
    </div>
  );
}