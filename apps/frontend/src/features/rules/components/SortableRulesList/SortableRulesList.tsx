import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Edit,
  Trash2,
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ValidationRule, SEVERITY_LABELS, CLIENT_TYPE_LABELS } from '../../schemas/ruleSchema';
import Button from '../../../../components/ui/Button';

interface SortableRulesListProps {
  rules: ValidationRule[];
  onReorder?: (rules: ValidationRule[]) => void;
  onEdit?: (rule: ValidationRule) => void;
  onDelete?: (ruleId: string) => void;
  onToggle?: (ruleId: string, active: boolean) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isLoading?: boolean;
}

interface SortableRuleRowProps {
  rule: ValidationRule;
  onEdit?: (rule: ValidationRule) => void;
  onDelete?: (ruleId: string) => void;
  onToggle?: (ruleId: string, active: boolean) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  isDragging?: boolean;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-error-100 text-error-800 border-error-200';
    case 'high':
      return 'bg-warning-100 text-warning-800 border-warning-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const SortableRuleRow: React.FC<SortableRuleRowProps> = ({
  rule,
  onEdit,
  onDelete,
  onToggle,
  isSelected,
  onSelect,
  isDragging = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSorting ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group bg-white border rounded-lg transition-all duration-200
        ${isSelected ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}
        ${isDragging ? 'shadow-lg ring-2 ring-primary-500' : 'hover:shadow-sm'}
      `}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(rule.id, e.target.checked)}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />

        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Rule info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{rule.name}</span>
            {rule.clientType && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs">
                {CLIENT_TYPE_LABELS[rule.clientType]}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">{rule.description}</div>
        </div>

        {/* Field */}
        <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
          {rule.field}
        </code>

        {/* Severity badge */}
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(rule.severity)}`}
        >
          {SEVERITY_LABELS[rule.severity]}
        </span>

        {/* Status */}
        {onToggle ? (
          <button
            onClick={() => onToggle(rule.id, !rule.isActive)}
            className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-gray-100"
          >
            {rule.isActive ? (
              <>
                <CheckCircle className="w-4 h-4 text-success-600" />
                <span className="text-sm text-success-600">Active</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Inactive</span>
              </>
            )}
          </button>
        ) : (
          <span className="flex items-center gap-1 px-2 py-1">
            {rule.isActive ? (
              <>
                <CheckCircle className="w-4 h-4 text-success-600" />
                <span className="text-sm text-success-600">Active</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Inactive</span>
              </>
            )}
          </span>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(rule)}
                className="text-gray-600 hover:text-primary-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rule.id)}
                className="text-gray-600 hover:text-error-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 mt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Message d'erreur:</span>
              <p className="text-gray-900">{rule.errorMessage}</p>
            </div>
            <div>
              <span className="text-gray-500">Catégorie:</span>
              <p className="text-gray-900">{rule.category}</p>
            </div>
            {rule.ruleDefinition && rule.ruleDefinition.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Conditions:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {rule.ruleDefinition.map((condition, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {condition.type}
                      {condition.value && `: ${condition.value}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Overlay component for drag preview
const DragOverlayContent: React.FC<{ rule: ValidationRule }> = ({ rule }) => {
  return (
    <div className="bg-white border-2 border-primary-500 rounded-lg shadow-xl p-4">
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div>
          <div className="font-medium text-gray-900">{rule.name}</div>
          <div className="text-sm text-gray-500">{rule.description}</div>
        </div>
      </div>
    </div>
  );
};

export const SortableRulesList: React.FC<SortableRulesListProps> = ({
  rules,
  onReorder,
  onEdit,
  onDelete,
  onToggle,
  selectedIds,
  onSelectionChange,
  isLoading = false,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeRule = useMemo(
    () => rules.find((rule) => rule.id === activeId),
    [activeId, rules]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = rules.findIndex((rule) => rule.id === active.id);
      const newIndex = rules.findIndex((rule) => rule.id === over.id);
      const newRules = arrayMove(rules, oldIndex, newIndex);
      onReorder(newRules);
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      onSelectionChange(rules.map((rule) => rule.id));
    } else {
      onSelectionChange([]);
    }
  };

  const allSelected = rules.length > 0 && selectedIds.length === rules.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < rules.length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucune règle trouvée</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Select all header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <span className="text-sm text-gray-600">
          {selectedIds.length > 0
            ? `${selectedIds.length} sélectionné${selectedIds.length > 1 ? 's' : ''}`
            : 'Tout sélectionner'}
        </span>
      </div>

      {/* Sortable list */}
      <div className="space-y-2">
        <SortableContext
          items={rules.map((rule) => rule.id)}
          strategy={verticalListSortingStrategy}
        >
          {rules.map((rule) => (
            <SortableRuleRow
              key={rule.id}
              rule={rule}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              isSelected={selectedIds.includes(rule.id)}
              onSelect={handleSelect}
            />
          ))}
        </SortableContext>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeRule ? <DragOverlayContent rule={activeRule} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SortableRulesList;
