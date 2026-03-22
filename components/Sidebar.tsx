"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  Upload,
  BookOpen,
  Briefcase,
  Video,
  PlayCircle,
  Settings,
  FolderOpen,
} from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "知识库概览", href: "/", icon: <Home className="h-4 w-4" /> },
    { label: "个人资料", href: "/resume", icon: <FileText className="h-4 w-4" /> },
    { label: "面试资源知识库", href: "/knowledge-base", icon: <FolderOpen className="h-4 w-4" /> },
    { label: "知识生成", href: "/generate", icon: <BookOpen className="h-4 w-4" /> },
    { label: "投递管理", href: "/applications", icon: <Briefcase className="h-4 w-4" /> },
    { label: "模拟面试", href: "/interview", icon: <Video className="h-4 w-4" /> },
    { label: "复习回顾", href: "/playback", icon: <PlayCircle className="h-4 w-4" /> },
    { label: "设置", href: "/settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      {/* 侧边栏容器 */}
      <div className="flex flex-col flex-grow border-r bg-background pt-5 pb-4 overflow-y-auto">
        <div className="flex items-baseline flex-shrink-0 px-4 whitespace-nowrap">
          <Link href="/" className="text-xl font-bold leading-tight">
            面试知识库
          </Link>
          <span className="hidden text-sm text-muted-foreground ml-2 leading-tight md:inline">
            个人知识库（面试版）
          </span>
        </div>
        <div className="mt-8 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start mb-1",
                      isActive && "bg-secondary font-medium"
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* 底部信息 */}
          <div className="px-4 mt-auto pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              面试资源知识库
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              管理您的面试资源，智能生成面试问题
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;