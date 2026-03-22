import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Brain, Video, PlayCircle, Settings, Plus, Search, BarChart, Calendar, Tag, Users } from "lucide-react";
import Link from "next/link";
import { KnowledgeCategory, CategoryConfig } from "@/lib/knowledgeCategories";

export default function Home() {
  // 模拟数据 - 在实际应用中可以从本地存储或API获取
  const stats = {
    totalItems: 42,
    byCategory: {
      [KnowledgeCategory.RESUME]: 12,
      [KnowledgeCategory.SCENARIO]: 8,
      [KnowledgeCategory.LLM_KNOWLEDGE]: 15,
      [KnowledgeCategory.CREATIVE_THINKING]: 7,
    },
    recentAdditions: 5,
    reviewDue: 3,
  };

  const quickActions = [
    {
      title: "添加知识条目",
      description: "手动添加新的面试问题或知识点",
      icon: <Plus className="h-8 w-8" />,
      href: "/questions",
      color: "bg-blue-100 text-blue-700",
      variant: "default" as const,
    },
    {
      title: "知识生成",
      description: "使用AI生成新的面试问题和知识点",
      icon: <Brain className="h-8 w-8" />,
      href: "/generate",
      color: "bg-purple-100 text-purple-700",
      variant: "default" as const,
    },
    {
      title: "模拟面试",
      description: "使用知识库中的问题进行面试练习",
      icon: <Video className="h-8 w-8" />,
      href: "/interview",
      color: "bg-orange-100 text-orange-700",
      variant: "default" as const,
    },
    {
      title: "复习回顾",
      description: "查看历史面试记录和复习进度",
      icon: <PlayCircle className="h-8 w-8" />,
      href: "/playback",
      color: "bg-green-100 text-green-700",
      variant: "default" as const,
    },
    {
      title: "个人资料",
      description: "管理您的简历和个人信息",
      icon: <FileText className="h-8 w-8" />,
      href: "/resume",
      color: "bg-cyan-100 text-cyan-700",
      variant: "outline" as const,
    },
    {
      title: "知识库设置",
      description: "配置知识库分类和偏好",
      icon: <Settings className="h-8 w-8" />,
      href: "/settings",
      color: "bg-gray-100 text-gray-700",
      variant: "outline" as const,
    },
  ];

  const recentItems = [
    { id: 1, text: "如何设计一个高效的RAG系统？", category: KnowledgeCategory.LLM_KNOWLEDGE, added: "2小时前" },
    { id: 2, text: "讲述一次你处理项目冲突的经历", category: KnowledgeCategory.SCENARIO, added: "1天前" },
    { id: 3, text: "Transformer模型的自注意力机制", category: KnowledgeCategory.LLM_KNOWLEDGE, added: "2天前" },
    { id: 4, text: "我的Python后端项目经验", category: KnowledgeCategory.RESUME, added: "3天前" },
    { id: 5, text: "如果AI产品出现伦理问题，你会如何处理？", category: KnowledgeCategory.CREATIVE_THINKING, added: "3天前" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">面试知识库</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          您的个人面试知识库，集中管理所有面试问题、答案、简历和复习材料。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">知识条目总数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">+{stats.recentAdditions} 最近添加</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待复习条目</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewDue}</div>
            <p className="text-xs text-muted-foreground">建议今日复习</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分类数量</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
            <p className="text-xs text-muted-foreground">知识分类</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模拟面试次数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">累计练习</p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="text-2xl font-bold mb-4">快速操作</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-full ${action.color}`}>
                    {action.icon}
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground"></span>
                </div>
                <CardTitle className="mt-4">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant={action.variant} className="w-full">
                  <Link href={action.href}>前往</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 分类分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              知识分类分布
            </CardTitle>
            <CardDescription>您的知识库按类别分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byCategory).map(([category, count]) => {
                const config = CategoryConfig[category as KnowledgeCategory];
                const percentage = Math.round((count / stats.totalItems) * 100);
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {count} 个 ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: `var(--color-${config.color})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 最近添加 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              最近添加的知识条目
            </CardTitle>
            <CardDescription>最新添加到知识库的内容</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentItems.map((item) => {
                const config = CategoryConfig[item.category];
                return (
                  <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color} bg-${config.color}-100`}>
                            {config.icon} {config.name}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.added}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/questions?search=${encodeURIComponent(item.text)}`}>
                          <Search className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/questions">查看所有知识条目</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 复习提醒 */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-600" />
            复习提醒
          </CardTitle>
          <CardDescription>
            根据艾宾浩斯遗忘曲线，建议定期复习以巩固记忆
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">今日有 {stats.reviewDue} 个知识条目需要复习</p>
              <p className="text-sm text-muted-foreground mt-1">
                复习过的条目记忆保留率会显著提高
              </p>
            </div>
            <Button asChild>
              <Link href="/playback">开始复习</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}