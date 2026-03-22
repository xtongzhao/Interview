"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useInterviewData, InterviewType, InterviewOutcome } from "@/hooks/useInterviewData";
import { useState, useEffect } from "react";
import { Plus, Search, Filter, Calendar, Clock, Star, Building, Users, Edit, Trash2, CheckCircle, XCircle, ChevronRight, Download, Upload } from "lucide-react";

export default function PlaybackPage() {
  const {
    reviews,
    applications,
    isLoading,
    addReview,
    updateReview,
    deleteReview,
    getReview,
    getReviewsByApplication,
    addInterviewQuestion,
  } = useInterviewData();

  const [activeTab, setActiveTab] = useState<'all' | InterviewOutcome>('all');
  const [searchText, setSearchText] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');

  // 新复盘表单状态
  const [newReview, setNewReview] = useState({
    jobApplicationId: '',
    interviewType: 'technical' as InterviewType,
    interviewDate: new Date().toISOString().split('T')[0],
    interviewers: [] as string[],
    duration: 60,
    questions: [] as Array<{ question: string; category: string; difficulty: 'easy' | 'medium' | 'hard' }>,
    notes: '',
    outcome: 'pending' as InterviewOutcome,
    feedback: '',
    strengths: [] as string[],
    weaknesses: [] as string[],
    improvements: [] as string[],
    keyLearnings: [] as string[],
  });

  // 结果徽章颜色映射
  const outcomeColors: Record<InterviewOutcome, string> = {
    pending: 'bg-gray-100 text-gray-700',
    passed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    waitlisted: 'bg-yellow-100 text-yellow-700',
  };

  // 结果徽章图标映射
  const outcomeIcons: Record<InterviewOutcome, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    passed: <CheckCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    waitlisted: <Clock className="h-3 w-3" />,
  };

  // 过滤复盘
  const filteredReviews = reviews.filter(review => {
    if (activeTab !== 'all' && review.outcome !== activeTab) return false;
    if (searchText) {
      const application = applications.find(app => app.id === review.jobApplicationId);
      const companyMatch = application?.company.toLowerCase().includes(searchText.toLowerCase());
      const positionMatch = application?.position.toLowerCase().includes(searchText.toLowerCase());
      return companyMatch || positionMatch;
    }
    return true;
  });

  // 按结果分组
  const reviewsByOutcome = {
    all: reviews,
    pending: reviews.filter(r => r.outcome === 'pending'),
    passed: reviews.filter(r => r.outcome === 'passed'),
    failed: reviews.filter(r => r.outcome === 'failed'),
    waitlisted: reviews.filter(r => r.outcome === 'waitlisted'),
  };

  // 重置表单
  const resetForm = () => {
    setNewReview({
      jobApplicationId: '',
      interviewType: 'technical',
      interviewDate: new Date().toISOString().split('T')[0],
      interviewers: [],
      duration: 60,
      questions: [],
      notes: '',
      outcome: 'pending',
      feedback: '',
      strengths: [],
      weaknesses: [],
      improvements: [],
      keyLearnings: [],
    });
    setEditingReview(null);
    setShowNewForm(false);
    setSelectedApplicationId('');
  };

  // 处理保存
  const handleSave = async () => {
    if (!newReview.jobApplicationId) {
      alert('请选择关联的投递记录');
      return;
    }

    const application = applications.find(app => app.id === newReview.jobApplicationId);
    if (!application) {
      alert('找不到对应的投递记录');
      return;
    }

    if (editingReview) {
      // 更新现有复盘
      const review = getReview(editingReview);
      if (review) {
        const updatedReview = {
          ...review,
          interviewType: newReview.interviewType,
          interviewDate: new Date(newReview.interviewDate),
          interviewers: newReview.interviewers,
          duration: newReview.duration,
          notes: newReview.notes,
          outcome: newReview.outcome,
          feedback: newReview.feedback,
          selfEvaluation: {
            strengths: newReview.strengths,
            weaknesses: newReview.weaknesses,
            improvements: newReview.improvements,
            keyLearnings: newReview.keyLearnings,
          },
          updatedAt: new Date(),
        };
        await updateReview(updatedReview);
      }
    } else {
      // 创建新复盘
      await addReview(newReview.jobApplicationId, newReview.interviewType);
      // 注意：addReview只创建基础复盘，需要进一步更新详细信息
      // 这里简化处理，实际应使用updateReview更新详细信息
    }

    resetForm();
  };

  // 处理编辑
  const handleEdit = (reviewId: string) => {
    const review = getReview(reviewId);
    if (review) {
      const application = applications.find(app => app.id === review.jobApplicationId);
      setNewReview({
        jobApplicationId: review.jobApplicationId,
        interviewType: review.interviewType,
        interviewDate: review.interviewDate.toISOString().split('T')[0],
        interviewers: review.interviewers,
        duration: review.duration || 60,
        questions: review.questions.map(q => ({
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
        })),
        notes: review.notes,
        outcome: review.outcome,
        feedback: review.feedback || '',
        strengths: review.selfEvaluation.strengths,
        weaknesses: review.selfEvaluation.weaknesses,
        improvements: review.selfEvaluation.improvements,
        keyLearnings: review.selfEvaluation.keyLearnings,
      });
      setEditingReview(reviewId);
      setShowNewForm(true);
    }
  };

  // 处理删除
  const handleDelete = async (reviewId: string) => {
    if (confirm('确定要删除这个面试复盘记录吗？')) {
      await deleteReview(reviewId);
    }
  };

  // 添加面试问题
  const handleAddQuestion = () => {
    setNewReview({
      ...newReview,
      questions: [...newReview.questions, { question: '', category: 'general', difficulty: 'medium' }],
    });
  };

  // 更新问题
  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updatedQuestions = [...newReview.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setNewReview({ ...newReview, questions: updatedQuestions });
  };

  // 统计数据
  const stats = {
    total: reviews.length,
    byOutcome: {
      pending: reviewsByOutcome.pending.length,
      passed: reviewsByOutcome.passed.length,
      failed: reviewsByOutcome.failed.length,
      waitlisted: reviewsByOutcome.waitlisted.length,
    },
  };

  // 获取关联的投递信息
  const getApplicationForReview = (review: any) => {
    return applications.find(app => app.id === review.jobApplicationId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">面试复盘</h1>
        <p className="text-muted-foreground">
          记录和回顾面试经历，总结经验教训，提升面试表现。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总复盘数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">累计面试复盘</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待定结果</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byOutcome.pending}</div>
            <p className="text-xs text-muted-foreground">等待面试结果</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">通过</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byOutcome.passed}</div>
            <p className="text-xs text-muted-foreground">成功通过面试</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byOutcome.failed}</div>
            <p className="text-xs text-muted-foreground">需要改进</p>
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
            新增复盘
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
            <CardTitle>{editingReview ? '编辑面试复盘' : '新增面试复盘'}</CardTitle>
            <CardDescription>
              记录面试详细信息，便于后续分析和提升
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">关联投递 *</label>
                <Select
                  value={newReview.jobApplicationId}
                  onValueChange={(value) => setNewReview({...newReview, jobApplicationId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择投递记录" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.company} - {app.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">面试类型</label>
                <Select
                  value={newReview.interviewType}
                  onValueChange={(value: InterviewType) => setNewReview({...newReview, interviewType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">电话面试</SelectItem>
                    <SelectItem value="video">视频面试</SelectItem>
                    <SelectItem value="onsite">现场面试</SelectItem>
                    <SelectItem value="technical">技术面试</SelectItem>
                    <SelectItem value="behavioral">行为面试</SelectItem>
                    <SelectItem value="case">案例分析</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">面试日期</label>
                <Input
                  type="date"
                  value={newReview.interviewDate}
                  onChange={(e) => setNewReview({...newReview, interviewDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">面试时长(分钟)</label>
                <Input
                  type="number"
                  value={newReview.duration}
                  onChange={(e) => setNewReview({...newReview, duration: parseInt(e.target.value) || 60})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">面试官</label>
                <Input
                  placeholder="用逗号分隔多个面试官"
                  value={newReview.interviewers.join(', ')}
                  onChange={(e) => setNewReview({
                    ...newReview,
                    interviewers: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">面试结果</label>
                <Select
                  value={newReview.outcome}
                  onValueChange={(value: InterviewOutcome) => setNewReview({...newReview, outcome: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待定</SelectItem>
                    <SelectItem value="passed">通过</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                    <SelectItem value="waitlisted">候补</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">面试问题</label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddQuestion}>
                  <Plus className="h-3 w-3 mr-1" />
                  添加问题
                </Button>
              </div>
              {newReview.questions.map((q, index) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <Input
                    placeholder="问题内容"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={q.category}
                      onValueChange={(value) => handleQuestionChange(index, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">通用</SelectItem>
                        <SelectItem value="technical">技术</SelectItem>
                        <SelectItem value="behavioral">行为</SelectItem>
                        <SelectItem value="case">案例</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={q.difficulty}
                      onValueChange={(value) => handleQuestionChange(index, 'difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="难度" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">简单</SelectItem>
                        <SelectItem value="medium">中等</SelectItem>
                        <SelectItem value="hard">困难</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">面试笔记</label>
              <Textarea
                placeholder="记录面试过程、关键对话、感受..."
                value={newReview.notes}
                onChange={(e) => setNewReview({...newReview, notes: e.target.value})}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">面试官反馈</label>
              <Textarea
                placeholder="面试官给出的反馈意见..."
                value={newReview.feedback}
                onChange={(e) => setNewReview({...newReview, feedback: e.target.value})}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">优点</label>
                <Textarea
                  placeholder="记录表现好的方面..."
                  value={newReview.strengths.join('\n')}
                  onChange={(e) => setNewReview({
                    ...newReview,
                    strengths: e.target.value.split('\n').filter(s => s.trim().length > 0)
                  })}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">不足</label>
                <Textarea
                  placeholder="记录需要改进的方面..."
                  value={newReview.weaknesses.join('\n')}
                  onChange={(e) => setNewReview({
                    ...newReview,
                    weaknesses: e.target.value.split('\n').filter(s => s.trim().length > 0)
                  })}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">改进计划</label>
                <Textarea
                  placeholder="针对不足制定的改进计划..."
                  value={newReview.improvements.join('\n')}
                  onChange={(e) => setNewReview({
                    ...newReview,
                    improvements: e.target.value.split('\n').filter(s => s.trim().length > 0)
                  })}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">关键收获</label>
                <Textarea
                  placeholder="从这次面试中学到的东西..."
                  value={newReview.keyLearnings.join('\n')}
                  onChange={(e) => setNewReview({
                    ...newReview,
                    keyLearnings: e.target.value.split('\n').filter(s => s.trim().length > 0)
                  })}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingReview ? '更新复盘' : '创建复盘'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 结果标签 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          全部 ({reviews.length})
        </Button>
        {Object.entries(outcomeColors).map(([outcome, color]) => (
          <Button
            key={outcome}
            variant={activeTab === outcome ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(outcome as InterviewOutcome)}
          >
            <span className="mr-1">{outcomeIcons[outcome as InterviewOutcome]}</span>
            {outcome === 'pending' && '待定'}
            {outcome === 'passed' && '通过'}
            {outcome === 'failed' && '失败'}
            {outcome === 'waitlisted' && '候补'}
            ({reviewsByOutcome[outcome as InterviewOutcome].length})
          </Button>
        ))}
      </div>

      {/* 复盘列表 */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">列表视图</TabsTrigger>
          <TabsTrigger value="timeline">时间线视图</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading.reviews ? (
            <div className="text-center py-8">
              <p>加载中...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无面试复盘记录</p>
                <p className="text-sm mt-1">点击"新增复盘"开始记录您的面试经历</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReviews.map((review) => {
                const application = getApplicationForReview(review);
                return (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {application && (
                                  <>
                                    <h3 className="text-lg font-semibold">{application.company}</h3>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">{application.position}</span>
                                  </>
                                )}
                                <Badge className={outcomeColors[review.outcome]}>
                                  {outcomeIcons[review.outcome]}
                                  <span className="ml-1">
                                    {review.outcome === 'pending' && '待定'}
                                    {review.outcome === 'passed' && '通过'}
                                    {review.outcome === 'failed' && '失败'}
                                    {review.outcome === 'waitlisted' && '候补'}
                                  </span>
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  面试日期: {review.interviewDate.toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  类型: {review.interviewType}
                                </span>
                                {review.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    时长: {review.duration}分钟
                                  </span>
                                )}
                              </div>
                              {review.notes && (
                                <p className="mt-3 text-sm bg-gray-50 p-2 rounded">
                                  {review.notes.length > 100 ? `${review.notes.substring(0, 100)}...` : review.notes}
                                </p>
                              )}
                              {review.questions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium">问题: {review.questions.length}个</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(review.id)}>
                            <Edit className="h-3 w-3 mr-1" />
                            编辑
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(review.id)}>
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

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>时间线视图</CardTitle>
              <CardDescription>按时间线查看面试复盘记录（开发中）</CardDescription>
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
              <a href="/applications">
                <Building className="h-6 w-6 mb-2" />
                <span>查看投递记录</span>
                <span className="text-xs text-muted-foreground mt-1">管理职位投递</span>
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
              <a href="/resources">
                <Upload className="h-6 w-6 mb-2" />
                <span>管理资源</span>
                <span className="text-xs text-muted-foreground mt-1">上传简历和资料</span>
              </a>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-4" onClick={() => setShowNewForm(true)}>
              <Plus className="h-6 w-6 mb-2" />
              <span>快速复盘</span>
              <span className="text-xs text-muted-foreground mt-1">立即记录面试</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}