import { useState } from "react";
import type { TodoRow as TodoRowType } from "@/lib/supabase/queries";
import { TodoCreateCard } from "./TodoCreateCard";
import { TodoDeleteDialog } from "./TodoDeleteDialog";
import { TodoEditCard } from "./TodoEditCard";
import { TodoRow } from "./TodoRow";
import { TodosBulkDeleteDialog } from "./TodosBulkDeleteDialog";
import { TodosSelectionBar } from "./TodosSelectionBar";
import { normalizePriority } from "./config";
import type { TodoPriority } from "./types";

export function TodosSection({
  todos,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  onDeleteTodos,
  onSetTodoCompleted,
  onActionMenuOpenChange,
}: {
  todos: TodoRowType[];
  onCreateTodo: (formData: {
    text: string;
    priority: TodoPriority;
  }) => Promise<string>;
  onUpdateTodo: (
    id: string,
    formData: { text: string; priority: TodoPriority },
  ) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
  onDeleteTodos: (ids: string[]) => Promise<void>;
  onSetTodoCompleted: (id: string, completed: boolean) => Promise<void>;
  onSetTodosCompleted: (ids: string[], completed: boolean) => Promise<void>;
  onActionMenuOpenChange?: (open: boolean) => void;
}) {
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);

  const [isTodosSelectionMode, setIsTodosSelectionMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [todosBulkDeleteDialogOpen, setTodosBulkDeleteDialogOpen] =
    useState(false);

  const [creatingTodo, setCreatingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] =
    useState<TodoPriority>("medium");
  const [isCreatingTodo, setIsCreatingTodo] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTodoText, setEditTodoText] = useState("");
  const [editTodoPriority, setEditTodoPriority] =
    useState<TodoPriority>("medium");
  const [isUpdatingTodo, setIsUpdatingTodo] = useState(false);

  const [todoDeleteDialogOpen, setTodoDeleteDialogOpen] = useState(false);
  const [todoIdPendingDelete, setTodoIdPendingDelete] = useState<string | null>(
    null,
  );

  const toggleSelectedTodo = (id: string) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitTodosSelectionMode = () => {
    setIsTodosSelectionMode(false);
    setSelectedTodoIds(new Set());
  };

  const handleCreateTodo = async () => {
    if (!newTodoText.trim()) return;
    setIsCreatingTodo(true);
    try {
      await onCreateTodo({
        text: newTodoText.trim(),
        priority: newTodoPriority,
      });
      setCreatingTodo(false);
      setNewTodoText("");
      setNewTodoPriority("medium");
    } finally {
      setIsCreatingTodo(false);
    }
  };

  const handleSaveTodo = async (id: string) => {
    if (!editTodoText.trim()) return;
    setIsUpdatingTodo(true);
    try {
      await onUpdateTodo(id, {
        text: editTodoText.trim(),
        priority: editTodoPriority,
      });
      setEditingTodoId(null);
    } finally {
      setIsUpdatingTodo(false);
    }
  };

  return (
    <>
      {isTodosSelectionMode ? (
        <TodosSelectionBar
          selectedCount={selectedTodoIds.size}
          onCancel={exitTodosSelectionMode}
          onDelete={() => {
            if (selectedTodoIds.size === 0) return;
            setTodosBulkDeleteDialogOpen(true);
          }}
        />
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hover-only flex flex-col gap-1">
        {todos.map((todo) => {
          const isEditing = editingTodoId === todo.id;
          const priority = normalizePriority(todo.priority);

          if (isEditing) {
            return (
              <TodoEditCard
                key={todo.id}
                todo={todo}
                editText={editTodoText}
                setEditText={setEditTodoText}
                editPriority={editTodoPriority}
                setEditPriority={setEditTodoPriority}
                isUpdating={isUpdatingTodo}
                onCancel={() => setEditingTodoId(null)}
                onSave={() => void handleSaveTodo(todo.id)}
              />
            );
          }

          return (
            <TodoRow
              key={todo.id}
              todo={todo}
              expanded={expandedTodoId === todo.id}
              onToggleExpanded={() =>
                setExpandedTodoId((prev) => (prev === todo.id ? null : todo.id))
              }
              selectionMode={isTodosSelectionMode}
              selected={selectedTodoIds.has(todo.id)}
              onToggleSelected={() => toggleSelectedTodo(todo.id)}
              onEnterSelectionMode={() => {
                setIsTodosSelectionMode(true);
                setSelectedTodoIds(new Set([todo.id]));
              }}
              onToggleCompleted={() =>
                void onSetTodoCompleted(todo.id, !todo.completed)
              }
              onEdit={() => {
                setEditingTodoId(todo.id);
                setEditTodoText(todo.text);
                setEditTodoPriority(priority);
              }}
              onDelete={() => {
                setTodoIdPendingDelete(todo.id);
                setTodoDeleteDialogOpen(true);
              }}
              onActionMenuOpenChange={onActionMenuOpenChange}
            />
          );
        })}
      </div>

      <TodoCreateCard
        creating={creatingTodo}
        setCreating={setCreatingTodo}
        text={newTodoText}
        setText={setNewTodoText}
        priority={newTodoPriority}
        setPriority={setNewTodoPriority}
        isCreating={isCreatingTodo}
        onCreate={() => void handleCreateTodo()}
      />

      <TodosBulkDeleteDialog
        open={todosBulkDeleteDialogOpen}
        onOpenChange={setTodosBulkDeleteDialogOpen}
        selectedCount={selectedTodoIds.size}
        onConfirm={async () => {
          await onDeleteTodos(Array.from(selectedTodoIds));
          setTodosBulkDeleteDialogOpen(false);
          exitTodosSelectionMode();
        }}
      />

      <TodoDeleteDialog
        open={todoDeleteDialogOpen}
        onOpenChange={setTodoDeleteDialogOpen}
        onConfirm={() => {
          if (!todoIdPendingDelete) return;
          void onDeleteTodo(todoIdPendingDelete);
          setTodoDeleteDialogOpen(false);
          setTodoIdPendingDelete(null);
        }}
      />
    </>
  );
}
