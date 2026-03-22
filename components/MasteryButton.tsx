"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Star } from 'lucide-react';
import { KnowledgeCategory } from '@/lib/knowledgeCategories';
import { SimpleVectorStore } from '@/lib/classifiedVectorStore';

interface MasteryButtonProps {
  chunkId: string;
  category: KnowledgeCategory;
  initialMastered?: boolean;
  onStatusChange?: (isMastered: boolean) => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  showLabel?: boolean;
}

export function MasteryButton({
  chunkId,
  category,
  initialMastered = false,
  onStatusChange,
  size = 'sm',
  variant = 'outline',
  showLabel = true,
}: MasteryButtonProps) {
  const [isMastered, setIsMastered] = useState(initialMastered);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleMastery = async () => {
    if (!chunkId || !category) {
      setError('缺少必要参数');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 直接更新本地向量存储
      const vectorStore = new SimpleVectorStore();
      const success = await vectorStore.markAsMastered(chunkId, category);

      if (success) {
        const newState = !isMastered;
        setIsMastered(newState);
        onStatusChange?.(newState);

        // 显示短暂的成功消息
        console.log(`掌握状态已更新: ${chunkId} -> ${newState ? '已掌握' : '未掌握'}`);

        // 可选：获取更新后的统计
        const stats = await vectorStore.getCategoryStats();
        console.log('更新后统计:', stats);
      } else {
        setError('更新失败：未找到对应内容');
        console.error('掌握状态更新失败：未找到对应内容');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新操作失败';
      setError(message);
      console.error('掌握状态更新异常:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据掌握状态确定样式
  const getButtonVariant = () => {
    if (isMastered) return 'default';
    return variant;
  };

  const getButtonText = () => {
    if (isMastered) {
      return showLabel ? '已掌握' : '';
    }
    return showLabel ? '标记掌握' : '';
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isMastered) {
      return <Check className="h-4 w-4" />;
    }
    return <Star className="h-4 w-4" />;
  };

  const getButtonClass = () => {
    const base = 'flex items-center gap-2 transition-all duration-200';
    if (isMastered) {
      return `${base} bg-green-500 hover:bg-green-600 text-white`;
    }
    return base;
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={getButtonVariant()}
        size={size}
        onClick={handleToggleMastery}
        disabled={isLoading}
        className={getButtonClass()}
        title={isMastered ? '点击取消掌握标记' : '点击标记为已掌握'}
      >
        {getIcon()}
        {showLabel && <span>{getButtonText()}</span>}
      </Button>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* 调试信息（仅开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1">
          <div>ID: {chunkId.substring(0, 8)}...</div>
          <div>分类: {category}</div>
          <div>状态: {isMastered ? '已掌握' : '待学习'}</div>
        </div>
      )}
    </div>
  );
}

// 简化版掌握按钮（仅图标）
export function MasteryIconButton({
  chunkId,
  category,
  initialMastered = false,
  onStatusChange,
}: Omit<MasteryButtonProps, 'showLabel' | 'size' | 'variant'>) {
  return (
    <MasteryButton
      chunkId={chunkId}
      category={category}
      initialMastered={initialMastered}
      onStatusChange={onStatusChange}
      size="icon"
      variant="ghost"
      showLabel={false}
    />
  );
}

// 掌握状态指示器（只读）
export function MasteryIndicator({ isMastered }: { isMastered: boolean }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {isMastered ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-600">已掌握</span>
        </>
      ) : (
        <>
          <Star className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">学习中</span>
        </>
      )}
    </div>
  );
}