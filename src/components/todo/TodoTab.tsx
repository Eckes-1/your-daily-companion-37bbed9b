import { useState } from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { Todo } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TodoItem } from './TodoItem';
import { AddTodo } from './AddTodo';

export function TodoTab() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (data: Omit<Todo, 'id' | 'completed' | 'createdAt'>) => {
    const newTodo: Todo = {
      ...data,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date(),
    };
    setTodos([newTodo, ...todos]);
  };

  const handleToggle = (id: string) => {
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleDelete = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  const completionRate = todos.length > 0 
    ? Math.round((completedTodos.length / todos.length) * 100) 
    : 0;

  return (
    <div className="pb-20">
      {/* Progress */}
      {todos.length > 0 && (
        <div className="px-4 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">今日进度</span>
              <span className="text-sm font-semibold text-primary">{completionRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              已完成 {completedTodos.length} / {todos.length} 项
            </p>
          </div>
        </div>
      )}

      {todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-todo flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">暂无待办</h3>
          <p className="text-sm text-muted-foreground mt-1">
            添加一些待办事项来规划你的一天
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {pendingTodos.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">待完成</h3>
              {pendingTodos.map((todo) => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo} 
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {completedTodos.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-muted-foreground">已完成</h3>
              {completedTodos.map((todo) => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo} 
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsAdding(true)}
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isAdding && (
        <AddTodo
          onAdd={handleAdd}
          onClose={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}
