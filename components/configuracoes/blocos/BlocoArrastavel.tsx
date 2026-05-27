'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  id: string;
  title: string;
  enabled: boolean;
  expanded: boolean;
  onToggleEnabled: () => void;
  onToggleExpanded: () => void;
  children: React.ReactNode;
}

export function BlocoArrastavel({
  id,
  title,
  enabled,
  expanded,
  onToggleEnabled,
  onToggleExpanded,
  children,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 select-none">
        <button
          type="button"
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          {...attributes}
          {...listeners}
          aria-label="Arrastar bloco"
        >
          <GripVertical size={18} />
        </button>

        <button
          type="button"
          onClick={onToggleEnabled}
          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
            enabled ? 'bg-green-500' : 'bg-slate-200'
          }`}
          aria-label={enabled ? 'Desativar bloco' : 'Ativar bloco'}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              enabled ? 'translate-x-4' : ''
            }`}
          />
        </button>

        <span
          className={`flex-1 text-sm font-semibold ${enabled ? 'text-slate-800' : 'text-slate-400'}`}
        >
          {title}
        </span>

        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0"
          aria-label={expanded ? 'Recolher' : 'Expandir'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 py-4 border-t border-slate-100">{children}</div>
      )}
    </div>
  );
}
