"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResourcesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/knowledge-base?tab=resources');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">页面已迁移</h1>
        <p className="text-muted-foreground mb-4">
          资源管理页面已合并到面试资源知识库。
        </p>
        <p className="text-sm text-muted-foreground">
          正在跳转到新页面...
        </p>
      </div>
    </div>
  );
}