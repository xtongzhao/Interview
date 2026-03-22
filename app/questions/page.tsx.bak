"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Copy, Star, Trash2, Upload, Search, Plus } from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import { QuestionCategory } from "@/lib/questionsParser";

export default function QuestionsPage() {
  const {
    questions,
    importText,
    setImportText,
    isLoading,
    activeCategory,
    setActiveCategory,
    searchText,
    setSearchText,
    filteredQuestions,
    categorizedQuestions,
    favoriteQuestions,
    categoryCounts,
    handleImport,
    handleToggleFavorite,
    handleDeleteQuestion,
    handleClearAll,
    handleAddCustomQuestion,
  } = useQuestions();
  const categoryLabels: Record<QuestionCategory, string> = {
    'general': '通用问题',
    'technical': '技术问题',
    'behavioral': '行为问题',
    'scenario': '场景问题',
    'ai-product': 'AI产品管理',
    'rag-design': 'RAG设计',
    'prompt-engineering': '提示工程',
    'system-design': '系统设计',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">知识条目管理</h1>
        <p className="text-muted-foreground">
          管理您的面试知识库条目，包括导入、分类、搜索和收藏。
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索问题..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleClearAll}>
          清空全部
        </Button>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">导入文本</TabsTrigger>
          <TabsTrigger value="categories">分类</TabsTrigger>
          <TabsTrigger value="favorites">收藏 ({favoriteQuestions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>粘贴面试问题</CardTitle>
              <CardDescription>
                从小红书或任何其他来源粘贴文本。每行或每个段落将被视为一个单独的问题。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="在此粘贴您的面试问题...
示例：
1. Tell me about yourself.
2. What is your experience with AI product management?
3. How would you design a RAG system?
..."
                className="min-h-[200px]"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={isLoading || !importText.trim()}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? '导入中...' : '导入'}
                </Button>
                <Button variant="outline" onClick={() => setImportText('')}>
                  清空
                </Button>
                <div className="text-sm text-muted-foreground ml-auto">
                  {questions.length} 个问题已导入
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory('all')}
              >
                全部 ({questions.length})
              </Button>
              {Object.entries(categoryLabels).map(([category, label]) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category as QuestionCategory)}
                >
                  {label} ({categoryCounts[category as QuestionCategory] || 0})
                </Button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(categoryLabels).map(([category, label]) => {
                const categoryQuestions = categorizedQuestions[category as QuestionCategory] || [];
                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg">{label}</CardTitle>
                      <CardDescription>{categoryQuestions.length} 个问题</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryQuestions.slice(0, 3).map((q) => (
                        <div key={q.id} className="text-sm p-2 border rounded">
                          {q.text.length > 80 ? `${q.text.substring(0, 80)}...` : q.text}
                        </div>
                      ))}
                      {categoryQuestions.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{categoryQuestions.length - 3} 更多</p>
                      )}
                      <Button variant="outline" className="w-full mt-2" asChild>
                        <a href={`#category-${category}`}>查看全部</a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {activeCategory !== 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>{categoryLabels[activeCategory as QuestionCategory]}</CardTitle>
                  <CardDescription>
                    {filteredQuestions.length} 个问题
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {filteredQuestions.map((q) => (
                      <li key={q.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{q.text}</span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">{q.category}</span>
                            {q.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleToggleFavorite(q.id)}>
                            <Star className={`h-4 w-4 ${q.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteQuestion(q.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>收藏的问题</CardTitle>
              <CardDescription>
                您标记为重要的待复习问题
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteQuestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  暂无收藏的问题。点击任意问题上的星形图标将其添加至此。
                </p>
              ) : (
                <ul className="space-y-3">
                  {favoriteQuestions.map((q) => (
                    <li key={q.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="flex-1">{q.text}</span>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleToggleFavorite(q.id)}>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>下一步：生成AI驱动的问题</CardTitle>
          <CardDescription>
            结合您的简历分析和导入的问题，生成个性化的面试问题。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <a href="/generate">生成问题</a>
          </Button>
          <Button variant="outline" onClick={() => {
            const text = prompt('请输入自定义问题：');
            if (text) {
              const category = prompt('分类（通用/技术/行为/等）：', 'general') as QuestionCategory;
              handleAddCustomQuestion(text, category);
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            添加自定义问题
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}