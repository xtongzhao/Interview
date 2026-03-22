"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Search, Filter, BookOpen, Brain, Lightbulb, FileText, Star, Clock, Download, RefreshCw, Zap, ChevronRight } from "lucide-react";
import { resourceProcessor } from "@/lib/resourceProcessor";
import { SimpleChunk } from "@/lib/classifiedVectorStore";
import { KnowledgeCategory, CategoryConfig, getAllCategories } from "@/lib/knowledgeCategories";

export default function KnowledgePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimpleChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchOptions, setSearchOptions] = useState({
    limit: 10,
    excludeMastered: false,
    minConfidence: 0.1,
  });

  // 加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('knowledge_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // 保存搜索历史
  const saveToSearchHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const updatedHistory = [
      searchQuery,
      ...searchHistory.filter(q => q !== searchQuery)
    ].slice(0, 10); // 最多保存10条

    setSearchHistory(updatedHistory);
    localStorage.setItem('knowledge_search_history', JSON.stringify(updatedHistory));
  };

  // 执行搜索
  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // 调用资源处理器的检索方法
      const results = await resourceProcessor.retrieveKnowledgeFromResources(
        query,
        undefined, // 所有资源类型
        searchOptions.limit
      );

      setSearchResults(results);
      saveToSearchHistory(query);
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 按类别筛选结果
  const filteredResults = selectedCategory === 'all'
    ? searchResults
    : searchResults.filter(chunk => chunk.category === selectedCategory);

  // 获取类别配置
  const getCategoryConfig = (category: KnowledgeCategory) => {
    return CategoryConfig[category] || { name: '未知', color: 'gray', icon: '❓' };
  };

  // 获取掌握状态徽章
  const getMasteryBadge = (isMastered: boolean) => {
    return isMastered ? (
      <Badge className="bg-green-100 text-green-700">
        <Star className="h-3 w-3 mr-1" />
        已掌握
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-700">
        <Clock className="h-3 w-3 mr-1" />
        待学习
      </Badge>
    );
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('knowledge_search_history');
  };

  // 快速搜索示例
  const quickSearchExamples = [
    "如何设计RAG系统",
    "AI产品经理的核心技能",
    "Transformer架构原理",
    "行为面试常见问题",
    "机器学习模型评估指标",
  ];

  // 类别统计
  const categoryStats = getAllCategories().reduce((acc, category) => {
    const count = searchResults.filter(chunk => chunk.category === category).length;
    if (count > 0) {
      acc[category] = count;
    }
    return acc;
  }, {} as Record<KnowledgeCategory, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">知识库检索</h1>
        <p className="text-muted-foreground">
          智能检索您的面试知识库，快速找到相关知识点，支持语义搜索和分类过滤。
        </p>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="输入您想搜索的面试知识点，例如：RAG系统设计、行为面试技巧、机器学习原理..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 py-6 text-lg"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    搜索中...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    搜索
                  </>
                )}
              </Button>
            </div>

            {/* 快速搜索示例 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                快速搜索:
              </span>
              {quickSearchExamples.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(example);
                    setTimeout(() => handleSearch(), 100);
                  }}
                >
                  {example}
                </Button>
              ))}
            </div>

            {/* 搜索选项 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">结果数量</label>
                <Select
                  value={searchOptions.limit.toString()}
                  onValueChange={(value) => setSearchOptions({...searchOptions, limit: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5个结果</SelectItem>
                    <SelectItem value="10">10个结果</SelectItem>
                    <SelectItem value="20">20个结果</SelectItem>
                    <SelectItem value="50">50个结果</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">分类筛选</label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as KnowledgeCategory | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有分类</SelectItem>
                    {getAllCategories().map(category => {
                      const config = getCategoryConfig(category);
                      return (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center">
                            <span className="mr-2">{config.icon}</span>
                            {config.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">其他选项</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="excludeMastered"
                    checked={searchOptions.excludeMastered}
                    onChange={(e) => setSearchOptions({...searchOptions, excludeMastered: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="excludeMastered" className="text-sm">排除已掌握内容</label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索结果和统计 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：搜索结果 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">搜索结果</h2>
            <div className="text-sm text-muted-foreground">
              找到 {filteredResults.length} 个相关知识点
              {selectedCategory !== 'all' && ` (${categoryStats[selectedCategory] || 0} 个在选中分类)`}
            </div>
          </div>

          {isSearching ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">正在智能检索知识库...</p>
              </CardContent>
            </Card>
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无搜索结果</p>
                <p className="text-sm mt-1">尝试输入关键词或选择其他分类</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((chunk, index) => {
                const categoryConfig = getCategoryConfig(chunk.category);
                return (
                  <Card key={chunk.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${categoryConfig.color} flex items-center gap-1`}>
                              {categoryConfig.icon}
                              {categoryConfig.name}
                            </Badge>
                            {getMasteryBadge(chunk.isMastered)}
                            {chunk.metadata?.source && (
                              <Badge variant="outline" className="text-xs">
                                来源: {chunk.metadata.source}
                              </Badge>
                            )}
                          </div>

                          <p className="text-lg font-medium mb-3">{chunk.text}</p>

                          {chunk.metadata && (
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
                              {chunk.metadata.resourceId && (
                                <span>资源ID: {chunk.metadata.resourceId.substring(0, 8)}...</span>
                              )}
                              {chunk.metadata.type && (
                                <span>类型: {chunk.metadata.type}</span>
                              )}
                              {chunk.metadata.fileName && (
                                <span>文件: {chunk.metadata.fileName}</span>
                              )}
                              {chunk.createdAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(chunk.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Star className="h-3 w-3 mr-1" />
                              标记掌握
                            </Button>
                            <Button size="sm" variant="outline">
                              <Brain className="h-3 w-3 mr-1" />
                              关联问题
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              查看原文
                            </Button>
                          </div>
                        </div>
                        <div className="ml-4 text-2xl text-gray-200">
                          #{index + 1}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* 右侧：统计和历史 */}
        <div className="space-y-6">
          {/* 分类统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                分类统计
              </CardTitle>
              <CardDescription>搜索结果按分类分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getAllCategories().map(category => {
                  const config = getCategoryConfig(category);
                  const count = categoryStats[category] || 0;
                  const percentage = searchResults.length > 0
                    ? Math.round((count / searchResults.length) * 100)
                    : 0;

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2">{config.icon}</span>
                          <span className="text-sm font-medium">{config.name}</span>
                        </div>
                        <span className="text-sm">{count} 个 ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.color.replace('bg-', 'bg-').replace('text-', '')}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 搜索历史 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                搜索历史
              </CardTitle>
              <CardDescription>最近搜索的关键词</CardDescription>
            </CardHeader>
            <CardContent>
              {searchHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">暂无搜索历史</p>
              ) : (
                <div className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-sm font-normal"
                      onClick={() => {
                        setQuery(item);
                        setTimeout(() => handleSearch(), 100);
                      }}
                    >
                      <ChevronRight className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="truncate">{item}</span>
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={clearSearchHistory}
                  >
                    清除历史
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                快速操作
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <a href="/resources">
                  <FileText className="h-4 w-4 mr-2" />
                  管理资源库
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/generate">
                  <Brain className="h-4 w-4 mr-2" />
                  生成面试问题
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/interview">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  模拟面试
                </a>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                // 导出搜索结果
                if (searchResults.length > 0) {
                  const dataStr = JSON.stringify(searchResults, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `knowledge_search_${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                } else {
                  alert('暂无搜索结果可导出');
                }
              }}>
                <Download className="h-4 w-4 mr-2" />
                导出搜索结果
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 使用提示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            使用提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">🔍 精准搜索</h4>
              <p className="text-sm text-muted-foreground">
                使用具体的关键词，如"Transformer注意力机制"而非"AI模型"。
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🏷️ 分类过滤</h4>
              <p className="text-sm text-muted-foreground">
                利用分类筛选快速定位特定类型的知识，如"简历相关"或"大模型知识"。
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📚 关联学习</h4>
              <p className="text-sm text-muted-foreground">
                将检索到的知识点与面试问题、模拟面试关联，形成学习闭环。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}