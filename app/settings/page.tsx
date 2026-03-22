"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Mic, Video, Bell, Shield, Database, Globe } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [voiceVolume, setVoiceVolume] = useState([80]);
  const [followUpIntensity, setFollowUpIntensity] = useState([60]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">知识库设置</h1>
        <p className="text-muted-foreground">
          配置您的AI面试官、隐私设置和知识库偏好。
        </p>
      </div>

      <Tabs defaultValue="interviewer" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="interviewer">Interviewer</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="interviewer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Interviewer Personality
              </CardTitle>
              <CardDescription>
                Customize your AI interviewer's style and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tone">Interviewer Tone</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly & Supportive</SelectItem>
                      <SelectItem value="professional">Professional & Neutral</SelectItem>
                      <SelectItem value="strict">Strict & Challenging</SelectItem>
                      <SelectItem value="casual">Casual & Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pace">Question Pace</Label>
                  <Select defaultValue="moderate">
                    <SelectTrigger id="pace">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (15s between questions)</SelectItem>
                      <SelectItem value="moderate">Moderate (10s between questions)</SelectItem>
                      <SelectItem value="fast">Fast (5s between questions)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Follow-up Question Intensity</Label>
                  <Slider
                    value={followUpIntensity}
                    onValueChange={setFollowUpIntensity}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {followUpIntensity[0]}% - How frequently the AI asks follow-up questions
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feedback">Real-time Feedback</Label>
                    <Switch id="feedback" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hints">Provide Hints</Label>
                    <Switch id="hints" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="encouragement">Encouragement Messages</Label>
                    <Switch id="encouragement" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Settings
              </CardTitle>
              <CardDescription>
                Configure voice synthesis and recognition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="voice">Voice Selection</Label>
                  <Select defaultValue="female1">
                    <SelectTrigger id="voice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female1">Female Voice 1 (Serena)</SelectItem>
                      <SelectItem value="female2">Female Voice 2 (Clara)</SelectItem>
                      <SelectItem value="male1">Male Voice 1 (David)</SelectItem>
                      <SelectItem value="male2">Male Voice 2 (Michael)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Voice Volume</Label>
                <Slider
                  value={voiceVolume}
                  onValueChange={setVoiceVolume}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground">
                  {voiceVolume[0]}% - Volume of AI interviewer's voice
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tts">Enable Text-to-Speech</Label>
                  <Switch id="tts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="stt">Enable Speech Recognition</Label>
                  <Switch id="stt" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="echo">Echo Cancellation</Label>
                  <Switch id="echo" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI model and API settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select defaultValue="gpt-4">
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude">Claude 3</SelectItem>
                      <SelectItem value="gemini">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">OpenAI API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cache">Cache AI Responses</Label>
                    <Switch id="cache" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fallback">Offline Fallback</Label>
                    <Switch id="fallback" />
                  </div>
                </div>
              </div>

              <Button>Test AI Connection</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="local">Local Processing Only</Label>
                    <p className="text-sm text-muted-foreground">
                      All data stays on your device
                    </p>
                  </div>
                  <Switch id="local" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app (anonymous)
                    </p>
                  </div>
                  <Switch id="analytics" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-delete">Auto-delete Recordings</Label>
                    <p className="text-sm text-muted-foreground">
                      Delete recordings after 30 days
                    </p>
                  </div>
                  <Switch id="auto-delete" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Data Management</h4>
                <div className="flex gap-2">
                  <Button variant="outline">Export All Data</Button>
                  <Button variant="outline">Clear Cache</Button>
                  <Button variant="destructive">Delete All Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage Settings
              </CardTitle>
              <CardDescription>
                Manage local storage and file locations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Storage Used</Label>
                    <p className="text-sm text-muted-foreground">
                      2.4 GB of local storage
                    </p>
                  </div>
                  <span className="font-medium">24%</span>
                </div>

                <div className="space-y-2">
                  <Label>Interview Recordings</Label>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm">Default location: Local browser storage</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Change Location
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Storage</Label>
                  <Select defaultValue="5gb">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1gb">1 GB</SelectItem>
                      <SelectItem value="5gb">5 GB</SelectItem>
                      <SelectItem value="10gb">10 GB</SelectItem>
                      <SelectItem value="unlimited">Unlimited (manual cleanup)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Clean Up Old Recordings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}