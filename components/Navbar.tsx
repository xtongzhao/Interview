import Link from "next/link";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navItems = [
    { label: "知识库概览", href: "/" },
    { label: "个人资料", href: "/resume" },
    { label: "资源管理", href: "/resources" },
    { label: "知识条目", href: "/questions" },
    { label: "知识生成", href: "/generate" },
    { label: "投递管理", href: "/applications" },
    { label: "模拟面试", href: "/interview" },
    { label: "复习回顾", href: "/playback" },
    { label: "设置", href: "/settings" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <Link href="/" className="text-xl font-bold leading-tight">
            面试知识库
          </Link>
          <span className="hidden text-sm text-muted-foreground leading-tight md:inline">
            个人知识库（面试版）
          </span>
        </div>
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;