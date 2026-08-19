import { useState } from "react";
import { PlusIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";

export default function TasksWidget({
  title = "Today's Tasks",
  initialTasks = [
    { id: 1, text: "Review monthly sales report", completed: true },
    { id: 2, text: "Follow up with top customers", completed: false },
    { id: 3, text: "Update product inventory", completed: false },
    { id: 4, text: "Confirm morning appointment roster", completed: false },
  ],
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState("");

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: newText.trim(), completed: false },
    ]);
    setNewText("");
    setIsAdding(false);
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground tracking-tight">
          {title}
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="grid h-7 w-7 place-items-center rounded-xl bg-secondary hover:bg-orange-500/10 text-foreground hover:text-orange-600 transition-colors btn-target shadow-2xs"
          title="Add new task"
          aria-label="Add new task"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Add Task Input */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="flex items-center gap-2 animate-fadeIn">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type task description..."
            autoFocus
            className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="scms-btn-apricot h-9 px-3 text-xs font-bold rounded-xl"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewText("");
            }}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground"
          >
            <Cross2Icon className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Tasks List */}
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            role="checkbox"
            aria-checked={task.completed}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTask(task.id);
              }
            }}
            className="group flex items-center gap-3 rounded-2xl p-2.5 hover:bg-secondary/60 transition-colors cursor-pointer select-none"
          >
            {/* Custom Circular Checkbox */}
            <div
              className={`grid h-5 w-5 place-items-center rounded-full border transition-all shrink-0 ${
                task.completed
                  ? "bg-orange-500 border-orange-500 text-white shadow-2xs"
                  : "border-border/90 group-hover:border-orange-400 bg-background"
              }`}
            >
              {task.completed && <CheckIcon className="w-3.5 h-3.5 stroke-2" />}
            </div>

            {/* Task Text */}
            <span
              className={`text-xs font-medium transition-all truncate flex-1 ${
                task.completed
                  ? "line-through text-muted-foreground/70"
                  : "text-foreground"
              }`}
            >
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
