"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Video, Pause, Play, SkipForward, Volume2, Settings, Clock, CheckCircle, SkipBack, FastForward, Rewind, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useInterview } from "@/hooks/useInterview";

export default function InterviewPage() {
  const {
    state,
    currentQuestion,
    progress,
    timeLeft,
    questionTimeLeft,
    startInterview,
    pauseInterview,
    resumeInterview,
    stopInterview,
    startRecording,
    stopRecording,
    answerCurrentQuestion,
    nextQuestion,
    previousQuestion,
    skipQuestion,
    updateSettings,
    resetInterview,
  } = useInterview();

  const [answerText, setAnswerText] = useState('');
  const [volume, setVolume] = useState([80]);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  // Load sample questions on first load if no questions are loaded
  useEffect(() => {
    if (state.questions.length === 0) {
      const sampleQuestions = [
        { id: '1', text: "Tell me about yourself and your experience with AI product management.", category: 'general', answered: false },
        { id: '2', text: "How would you design a RAG system for a knowledge base application?", category: 'technical', answered: false },
        { id: '3', text: "What metrics would you track for a prompt engineering platform?", category: 'product', answered: false },
        { id: '4', text: "Describe a time when you had to convince stakeholders about a technical decision.", category: 'behavioral', answered: false },
        { id: '5', text: "How do you approach ethical considerations in AI product development?", category: 'scenario', answered: false },
      ];
      // Note: In a real app, you would call loadQuestions here
      // For now, we'll just show the sample questions in the UI
    }
  }, [state.questions.length]);

  // Time warning for current question
  useEffect(() => {
    if (state.isInterviewActive && !state.isPaused && questionTimeLeft <= 30 && questionTimeLeft > 0) {
      setShowTimeWarning(true);
    } else {
      setShowTimeWarning(false);
    }
  }, [questionTimeLeft, state.isInterviewActive, state.isPaused]);

  const handleSubmitAnswer = () => {
    if (answerText.trim() && currentQuestion) {
      answerCurrentQuestion(answerText);
      setAnswerText('');
      // Auto-advance after answering (optional)
      // setTimeout(() => nextQuestion(), 2000);
    }
  };

  const handleStartStopRecording = () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">模拟面试</h1>
        <p className="text-muted-foreground">
          使用知识库中的问题进行模拟面试练习，AI面试官将根据您的表现提供反馈。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>面试会话</span>
              <div className="flex items-center gap-2 text-sm font-normal">
                <Clock className="h-4 w-4" />
                <span>{formatTime(state.elapsedTime)} / {formatTime(state.settings.duration * 60)}</span>
                {showTimeWarning && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{questionTimeLeft}s left</span>
                  </div>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              AI面试官: {state.settings.interviewerTone === 'professional' ? 'Serena' :
                state.settings.interviewerTone === 'friendly' ? 'Alex' : 'Dr. Miller'} ({state.settings.interviewerTone} 语气)
              {state.isRecording && <span className="ml-2 text-red-600">• 录制中</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative">
              {/* Video feed placeholder */}
              <div className="text-center">
                <Video className="h-16 w-16 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-400">
                  {state.isInterviewActive ? '摄像头画面活跃中' : '摄像头画面将在此显示'}
                </p>
                {!state.isInterviewActive ? (
                  <Button className="mt-4" onClick={startInterview} disabled={state.questions.length === 0}>
                    开始面试
                  </Button>
                ) : (
                  <Button className="mt-4" onClick={handleStartStopRecording}>
                    {state.isRecording ? '停止录制' : '开始录制'}
                  </Button>
                )}
              </div>
              {state.isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white">录制中</span>
                </div>
              )}
              {state.isPaused && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-amber-500 text-white px-3 py-1 rounded-full">
                  <Pause className="h-3 w-3" />
                  <span className="text-sm">已暂停</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>{state.currentQuestionIndex + 1} / {state.questions.length} 个问题</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button size="icon" variant="outline" onClick={previousQuestion} disabled={!state.isInterviewActive || state.currentQuestionIndex === 0}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => state.isPaused ? resumeInterview() : pauseInterview()} disabled={!state.isInterviewActive}>
                {state.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant={state.isInterviewActive ? "default" : "outline"} onClick={state.isInterviewActive ? stopInterview : startInterview}>
                {state.isInterviewActive ? '停止' : '开始'}
              </Button>
              <Button size="icon" variant="outline" onClick={nextQuestion} disabled={!state.isInterviewActive || state.currentQuestionIndex >= state.questions.length - 1}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>问题</CardTitle>
            <CardDescription>
              {state.isInterviewActive ? '当前和即将到来的问题' : '加载问题以开始'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="current">当前</TabsTrigger>
                <TabsTrigger value="upcoming">即将到来</TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="space-y-4">
                {currentQuestion ? (
                  <>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">当前问题</span>
                        <span className="text-sm text-muted-foreground">#{state.currentQuestionIndex + 1}</span>
                      </div>
                      <p className="mt-2">{currentQuestion.text}</p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" onClick={handleSubmitAnswer} disabled={!answerText.trim()}>
                          提交回答
                        </Button>
                        <Button size="sm" variant="outline" onClick={skipQuestion}>
                          跳过
                        </Button>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        剩余时间: {formatTime(questionTimeLeft)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">您的回答</h4>
                      <Textarea
                        placeholder="在此输入您的回答，或启用语音输入..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSubmitAnswer} disabled={!answerText.trim()} className="flex-1">
                          提交回答
                        </Button>
                        <Button variant="outline" onClick={() => setAnswerText('')}>
                          清空
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {state.questions.length === 0
                      ? '未加载问题。前往生成页面创建问题。'
                      : '面试未开始。点击“开始面试”以开始。'}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="space-y-3">
                {state.questions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">未加载问题</div>
                ) : (
                  state.questions.map((q, index) => (
                    <div
                      key={q.id}
                      className={`p-3 border rounded-lg ${
                        q.answered ? 'bg-green-50' : index === state.currentQuestionIndex ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">问题 #{index + 1}</span>
                        <div className="flex items-center gap-2">
                          {q.answered && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {index === state.currentQuestionIndex && state.isInterviewActive && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mt-1">{q.text}</p>
                      {q.answer && (
                        <div className="mt-2 text-xs text-gray-600 p-2 bg-gray-100 rounded">
                          <strong>您的回答:</strong> {q.answer.length > 100 ? `${q.answer.substring(0, 100)}...` : q.answer}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>面试设置</CardTitle>
            <CardDescription>
              配置面试体验
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>面试官语气</span>
              <span className="font-medium capitalize">{state.settings.interviewerTone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>问题节奏</span>
              <span className="font-medium capitalize">{state.settings.questionPace}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>跟进问题</span>
              <span className="font-medium">{state.settings.followUpQuestions ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>每个问题时间限制</span>
              <span className="font-medium">{state.settings.timeLimitPerQuestion / 60} minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span>总时长</span>
              <span className="font-medium">{state.settings.duration} minutes</span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const tone = prompt('面试官语气（友好/专业/严格）:', state.settings.interviewerTone);
                const pace = prompt('问题节奏（慢/适中/快）:', state.settings.questionPace);
                const duration = prompt('总时长（分钟）:', state.settings.duration.toString());
                const timeLimit = prompt('每个问题时间（秒）:', state.settings.timeLimitPerQuestion.toString());

                if (tone) updateSettings({ interviewerTone: tone as any });
                if (pace) updateSettings({ questionPace: pace as any });
                if (duration) updateSettings({ duration: parseInt(duration) });
                if (timeLimit) updateSettings({ timeLimitPerQuestion: parseInt(timeLimit) });
              }}
            >
              调整设置
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>
              常用面试控制
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => state.isPaused ? resumeInterview() : pauseInterview()}
              disabled={!state.isInterviewActive}
            >
              {state.isPaused ? '恢复面试' : '暂停面试'}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                if (currentQuestion) {
                  const newAnswer = prompt('编辑您的回答:', currentQuestion.answer || '');
                  if (newAnswer !== null) {
                    answerCurrentQuestion(newAnswer);
                  }
                }
              }}
              disabled={!currentQuestion}
            >
              编辑当前回答
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                const questions = JSON.parse(localStorage.getItem('generated-questions') || '[]');
                if (questions.length > 0) {
                  if (confirm(`加载 ${questions.length} 个生成的问题？`)) {
                    // Note: In a real app, you would call loadQuestions here
                    alert('问题加载功能将在此实现。');
                  }
                } else {
                  alert('未找到生成的问题。请先生成问题。');
                }
              }}
            >
              加载生成的问题
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => {
                if (confirm('确定要结束面试吗？所有进度将被保存。')) {
                  stopInterview();
                }
              }}
            >
              结束面试
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}