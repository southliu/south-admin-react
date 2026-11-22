import type { TabsData } from '@/stores/tabs';

export function getTabPath(tabs: TabsData[], key: string): string {
  return `${key}${tabs.find((tab) => tab.key === key)?.urlParams || ''}`;
}

export function getNextTab(tabs: TabsData[], key: string): TabsData | undefined {
  const index = tabs.findIndex((tab) => tab.key === key);
  if (index < 0) return undefined;
  return tabs[index - 1] || tabs[index + 1];
}
