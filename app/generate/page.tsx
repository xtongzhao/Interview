"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Edit, Shuffle, Trash2, Download, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuestionGeneration } from "@/hooks/useQuestionGeneration";
import { useState } from "react";

export default function GeneratePage() {
  const {
    questions,
    settings,
    isGenerating,
    questionsByCategory,
    generateQuestions,
    addCustomQuestion,
    editQuestion,
    deleteQuestion,
    updateSettings,
    exportQuestions,
  } = useQuestionGeneration();

  const [activeTab, setActiveTab] = useState('all');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const categoryLabels = {
    general: '通用',
    technical: '技术',
    behavioral: '行为',
    scenario: '场景',
    product: '产品',
    experience: '经验',
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  const handleStartEditing = (questionId: string, text: string) => {
    setEditingQuestionId(questionId);
    setEditingText(text);
  };

  const handleSaveEdit = (questionId: string) => {
    if (editingText.trim()) {
      editQuestion(questionId, { text: editingText });
    }
    setEditingQuestionId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditingText('');
  };

  const handleAddCustom = () => {
    const text = prompt('请输入您的自定义问题：');
    if (text) {
      const category = prompt('分类（通用/技术/行为/等）：', 'general') as any;
      addCustomQuestion(text, category);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">知识生成</h1>
        <p className="text-muted-foreground">
          AI根据您的个人资料和知识库生成个性化的面试知识点和问题。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              生成的问题
            </CardTitle>
            <CardDescription>
              {questions.length} 个问题已生成。查看并编辑AI生成的问题。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">全部问题 ({questions.length})</TabsTrigger>
                <TabsTrigger value="general">通用 ({questionsByCategory.general?.length || 0})</TabsTrigger>
                <TabsTrigger value="technical">技术 ({questionsByCategory.technical?.length || 0})</TabsTrigger>
                <TabsTrigger value="behavioral">行为 ({questionsByCategory.behavioral?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    尚未生成问题。点击“生成新问题”开始。
                  </div>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-medium px-2 py-1 rounded ${difficultyColors[q.difficulty]}`}>
                            {q.difficulty.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {categoryLabels[q.category]}
                          </span>
                          {q.isCustom && <span className="text-sm font-medium px-2 py-1 bg-green-100 text-green-700 rounded">自定义</span>}
                        </div>
                        {editingQuestionId === q.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEdit(q.id)}>保存</Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>取消</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-800">{q.text}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleStartEditing(q.id, q.text)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex gap-2">
              <Button onClick={generateQuestions} disabled={isGenerating}>
                <Shuffle className="h-4 w-4 mr-2" />
                {isGenerating ? '生成中...' : '生成新问题'}
              </Button>
              <Button variant="outline" onClick={handleAddCustom}>
                <Plus className="h-4 w-4 mr-2" />
                添加自定义问题
              </Button>
              <Button variant="ghost" onClick={exportQuestions} disabled={questions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>生成设置</CardTitle>
            <CardDescription>
              配置AI生成问题的方式
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>通用问题比例: {settings.generalRatio}%</Label>
                <Slider
                  value={[settings.generalRatio]}
                  onValueChange={(value) => updateSettings({ generalRatio: value[0] })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground">关于背景和经验的基本问题</p>
              </div>
              <div>
                <Label>技术问题比例: {settings.technicalRatio}%</Label>
                <Slider
                  value={[settings.technicalRatio]}
                  onValueChange={(value) => updateSettings({ technicalRatio: value[0] })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground">针对AI产品管理的特定问题</p>
              </div>
              <div>
                <Label>行为问题比例: {settings.behavioralRatio}%</Label>
                <Slider
                  value={[settings.behavioralRatio]}
                  onValueChange={(value) => updateSettings({ behavioralRatio: value[0] })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground">基于场景和行为的问题</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-resume">包含简历分析</Label>
                <Switch
                  id="include-resume"
                  checked={settings.includeResume}
                  onCheckedChange={(checked) => updateSettings({ includeResume: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-imported">包含导入的问题</Label>
                <Switch
                  id="include-imported"
                  checked={settings.includeImported}
                  onCheckedChange={(checked) => updateSettings({ includeImported: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="randomize">随机排序</Label>
                <Switch
                  id="randomize"
                  checked={settings.randomizeOrder}
                  onCheckedChange={(checked) => updateSettings({ randomizeOrder: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">目标职位（可选）</Label>
                <Input
                  id="position"
                  placeholder="例如：AI产品经理"
                  value={settings.position}
                  onChange={(e) => updateSettings({ position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">行业（可选）</Label>
                <Input
                  id="industry"
                  placeholder="例如：科技、金融、医疗"
                  value={settings.industry}
                  onChange={(e) => updateSettings({ industry: e.target.value })}
                />
              </div>
            </div>

            <Button className="w-full" onClick={generateQuestions} disabled={isGenerating}>
              {isGenerating ? '生成中...' : '生成新问题'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>准备面试了吗？</CardTitle>
          <CardDescription>
            使用生成的问题开始模拟面试。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild size="lg" disabled={questions.length === 0}>
            <a href="/interview">开始视频面试</a>
          </Button>
          <Button variant="outline" asChild disabled={questions.length === 0}>
            <a href="/interview?text">纯文本练习</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}