import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Plus, RefreshCw, Loader2, AlertTriangle, Search, Filter, Keyboard } from 'lucide-react';
import {
  useValidationRules,
  useCreateRule,
  useUpdateRule,
  useDeleteRule,
  useToggleRule,
  useBulkRuleOperations,
  useUpdatePriorities,
} from '../../hooks/useValidationRules';
import { ValidationRule, RuleFormData, CLIENT_TYPE_LABELS } from '../../schemas/ruleSchema';
import { SortableRulesList } from '../SortableRulesList';
import { RuleEditor } from '../RuleEditor';
import { BulkActionsBar } from '../BulkActionsBar';
import { CommandPalette, useRuleCommands } from '../CommandPalette';
import { ErrorBoundary } from '../ErrorBoundary';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ValidationRulesManagerProps {
  onSwitchTab?: (tab: string) => void;
}

export const ValidationRulesManager: React.FC<ValidationRulesManagerProps> = ({
  onSwitchTab,
}) => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  // State
  const [selectedClientType, setSelectedClientType] = useState<'1' | '2' | '3' | 'all'>('all');
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Queries and mutations
  const {
    data: rules = [],
    isLoading,
    error,
    refetch,
  } = useValidationRules({
    clientType: selectedClientType === 'all' ? undefined : selectedClientType,
  });

  const createMutation = useCreateRule();
  const updateMutation = useUpdateRule();
  const deleteMutation = useDeleteRule();
  const toggleMutation = useToggleRule();
  const { bulkToggle, bulkDelete } = useBulkRuleOperations();
  const updatePriorities = useUpdatePriorities();

  // Filtered rules
  const filteredRules = useMemo(() => {
    if (!debouncedSearch) return rules;
    const search = debouncedSearch.toLowerCase();
    return rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(search) ||
        rule.field.toLowerCase().includes(search) ||
        rule.description.toLowerCase().includes(search) ||
        rule.errorMessage.toLowerCase().includes(search)
    );
  }, [rules, debouncedSearch]);

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreateRule = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleEditRule = useCallback((rule: ValidationRule) => {
    setEditingRule(rule);
  }, []);

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      const confirmed = await confirm('Êtes-vous sûr de vouloir supprimer cette règle ?');
      if (!confirmed) return;
      deleteMutation.mutate(ruleId);
    },
    [deleteMutation, confirm]
  );

  const handleToggleRule = useCallback(
    (ruleId: string, active: boolean) => {
      toggleMutation.mutate({ id: ruleId, active });
    },
    [toggleMutation]
  );

  const handleSaveRule = useCallback(
    async (data: RuleFormData) => {
      if (editingRule) {
        await updateMutation.mutateAsync({
          id: editingRule.id,
          ...data,
          clientType: data.clientType as '1' | '2' | '3' | null,
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          clientType: data.clientType as '1' | '2' | '3' | null,
        });
      }
      setEditingRule(null);
      setIsCreating(false);
    },
    [editingRule, updateMutation, createMutation]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingRule(null);
    setIsCreating(false);
  }, []);

  const handleReorder = useCallback(
    (reorderedRules: ValidationRule[]) => {
      const priorities = reorderedRules.map((rule, index) => ({
        id: rule.id,
        priority: index + 1,
      }));
      updatePriorities.mutate(priorities);
    },
    [updatePriorities]
  );

  const handleBulkActivate = useCallback(() => {
    bulkToggle.mutate({ ids: selectedIds, active: true });
    setSelectedIds([]);
  }, [selectedIds, bulkToggle]);

  const handleBulkDeactivate = useCallback(() => {
    bulkToggle.mutate({ ids: selectedIds, active: false });
    setSelectedIds([]);
  }, [selectedIds, bulkToggle]);

  const handleBulkDelete = useCallback(async () => {
    const confirmed = await confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} règle(s) ?`);
    if (!confirmed) return;
    bulkDelete.mutate(selectedIds);
    setSelectedIds([]);
  }, [selectedIds, bulkDelete, confirm]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleExport = useCallback(() => {
    // Export logic - could trigger a modal or download
    const dataStr = JSON.stringify(filteredRules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-rules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRules]);

  // Command palette commands
  const commands = useRuleCommands({
    onNewRule: handleCreateRule,
    onRefresh: handleRefresh,
    onExport: handleExport,
    onSearch: handleFocusSearch,
    onSwitchTab,
    selectedCount: selectedIds.length,
    onBulkActivate: handleBulkActivate,
    onBulkDeactivate: handleBulkDeactivate,
    onBulkDelete: handleBulkDelete,
  });

  // Stats
  const stats = useMemo(() => {
    const active = rules.filter((r) => r.isActive).length;
    const inactive = rules.length - active;
    const bySeverity = {
      critical: rules.filter((r) => r.severity === 'critical').length,
      high: rules.filter((r) => r.severity === 'high').length,
      medium: rules.filter((r) => r.severity === 'medium').length,
      low: rules.filter((r) => r.severity === 'low').length,
    };
    return { total: rules.length, active, inactive, bySeverity };
  }, [rules]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <ConfirmDialogPortal />
        {/* Command Palette */}
        <CommandPalette commands={commands} />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-end gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )
              }
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Actualiser
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleCreateRule}
                disabled={isLoading}
              >
                Nouvelle Règle
              </Button>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total des règles</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-success-600">{stats.active}</div>
            <div className="text-sm text-gray-500">Règles actives</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-error-600">{stats.bySeverity.critical}</div>
            <div className="text-sm text-gray-500">Critiques</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-warning-600">{stats.bySeverity.high}</div>
            <div className="text-sm text-gray-500">Haute sévérité</div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une règle... (Appuyez sur /)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Client type filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex gap-1">
                  {(['all', '1', '2', '3'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedClientType(type)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        selectedClientType === type
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {CLIENT_TYPE_LABELS[type] || 'Tous'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {filteredRules.length} règle{filteredRules.length !== 1 ? 's' : ''} trouvée
                {filteredRules.length !== 1 ? 's' : ''}
                {debouncedSearch && ` pour "${debouncedSearch}"`}
              </span>
              {selectedIds.length > 0 && (
                <span className="text-primary-600 font-medium">
                  {selectedIds.length} sélectionnée{selectedIds.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Rules list */}
        <Card>
          {error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-error-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erreur lors du chargement
              </h3>
              <p className="text-gray-500 mb-4">
                Vérifiez que le serveur Spring Boot est démarré sur le port 8080.
              </p>
              <Button variant="outline" onClick={handleRefresh}>
                Réessayer
              </Button>
            </div>
          ) : (
            <SortableRulesList
              rules={filteredRules}
              onReorder={isAdmin ? handleReorder : undefined}
              onEdit={isAdmin ? handleEditRule : undefined}
              onDelete={isAdmin ? handleDeleteRule : undefined}
              onToggle={isAdmin ? handleToggleRule : undefined}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              isLoading={isLoading}
            />
          )}
        </Card>

        {/* Bulk actions bar */}
        {isAdmin && (
          <BulkActionsBar
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onActivate={handleBulkActivate}
            onDeactivate={handleBulkDeactivate}
            onDelete={handleBulkDelete}
            onExport={handleExport}
            isLoading={bulkToggle.isPending || bulkDelete.isPending}
          />
        )}

        {/* Rule editor modal */}
        {(editingRule || isCreating) && (
          <RuleEditor
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={handleCancelEdit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ValidationRulesManager;
