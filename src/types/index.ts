export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface Sticky {
  id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green';
  createdAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
}

export type TabType = 'notes' | 'accounting' | 'sticky' | 'todo';
