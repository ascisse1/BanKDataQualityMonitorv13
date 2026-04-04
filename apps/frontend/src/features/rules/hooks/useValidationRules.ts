import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesApi } from '../api/rulesApi';
import { ValidationRule, CreateRuleInput, UpdateRuleInput } from '../schemas/ruleSchema';
import { useToast } from '@/components/ui/Toaster';

// Query keys
export const ruleKeys = {
  all: ['validation-rules'] as const,
  lists: () => [...ruleKeys.all, 'list'] as const,
  list: (filters: { clientType?: string; active?: boolean }) =>
    [...ruleKeys.lists(), filters] as const,
  details: () => [...ruleKeys.all, 'detail'] as const,
  detail: (id: string) => [...ruleKeys.details(), id] as const,
};

/**
 * Hook to fetch all validation rules
 */
export const useValidationRules = (options?: {
  clientType?: '1' | '2' | '3';
  enabled?: boolean;
}) => {
  const { clientType, enabled = true } = options || {};

  return useQuery({
    queryKey: ruleKeys.list({ clientType }),
    queryFn: () =>
      clientType
        ? rulesApi.fetchRulesByClientType(clientType)
        : rulesApi.fetchRules(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });
};

/**
 * Hook to fetch all rules including inactive
 */
export const useAllValidationRules = () => {
  return useQuery({
    queryKey: [...ruleKeys.all, 'all-rules'],
    queryFn: () => rulesApi.fetchAllRules(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch a single rule by ID
 */
export const useValidationRule = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ruleKeys.detail(id),
    queryFn: () => rulesApi.fetchRuleById(id),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id,
  });
};

/**
 * Hook for creating a new rule
 */
export const useCreateRule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (rule: CreateRuleInput) => rulesApi.createRule(rule),
    onMutate: async (newRule) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ruleKeys.lists() });

      // Snapshot the previous value
      const previousRules = queryClient.getQueryData<ValidationRule[]>(ruleKeys.list({}));

      // Optimistically update
      if (previousRules) {
        const optimisticRule: ValidationRule = {
          ...newRule,
          id: `RULE_TEMP_${Date.now()}`,
          category: newRule.category || 'Autres',
        };
        queryClient.setQueryData<ValidationRule[]>(
          ruleKeys.list({}),
          [...previousRules, optimisticRule]
        );
      }

      return { previousRules };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousRules) {
        queryClient.setQueryData(ruleKeys.list({}), context.previousRules);
      }
      addToast('Erreur lors de la création de la règle', 'error');
    },
    onSuccess: () => {
      addToast('Règle créée avec succès', 'success');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};

/**
 * Hook for updating a rule
 */
export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (rule: UpdateRuleInput) => rulesApi.updateRule(rule),
    onMutate: async (updatedRule) => {
      await queryClient.cancelQueries({ queryKey: ruleKeys.lists() });

      const previousRules = queryClient.getQueryData<ValidationRule[]>(ruleKeys.list({}));

      if (previousRules) {
        queryClient.setQueryData<ValidationRule[]>(
          ruleKeys.list({}),
          previousRules.map((r) =>
            r.id === updatedRule.id ? { ...r, ...updatedRule } : r
          )
        );
      }

      return { previousRules };
    },
    onError: (err, _, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(ruleKeys.list({}), context.previousRules);
      }
      addToast('Erreur lors de la mise à jour de la règle', 'error');
    },
    onSuccess: () => {
      addToast('Règle mise à jour avec succès', 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};

/**
 * Hook for deleting a rule
 */
export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => rulesApi.deleteRule(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ruleKeys.lists() });

      const previousRules = queryClient.getQueryData<ValidationRule[]>(ruleKeys.list({}));

      if (previousRules) {
        queryClient.setQueryData<ValidationRule[]>(
          ruleKeys.list({}),
          previousRules.filter((r) => r.id !== deletedId)
        );
      }

      return { previousRules };
    },
    onError: (err, _, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(ruleKeys.list({}), context.previousRules);
      }
      addToast('Erreur lors de la suppression de la règle', 'error');
    },
    onSuccess: () => {
      addToast('Règle supprimée avec succès', 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};

/**
 * Hook for toggling a rule's active status
 */
export const useToggleRule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      rulesApi.toggleRule(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ruleKeys.lists() });

      const previousRules = queryClient.getQueryData<ValidationRule[]>(ruleKeys.list({}));

      if (previousRules) {
        queryClient.setQueryData<ValidationRule[]>(
          ruleKeys.list({}),
          previousRules.map((r) =>
            r.id === id ? { ...r, isActive: active } : r
          )
        );
      }

      return { previousRules };
    },
    onError: (err, _, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(ruleKeys.list({}), context.previousRules);
      }
      addToast('Erreur lors de la modification du statut', 'error');
    },
    onSuccess: (_, { active }) => {
      addToast(active ? 'Règle activée' : 'Règle désactivée', 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};

/**
 * Hook for bulk operations
 */
export const useBulkRuleOperations = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const bulkToggle = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      rulesApi.bulkToggle(ids, active),
    onMutate: async ({ ids, active }) => {
      await queryClient.cancelQueries({ queryKey: ruleKeys.lists() });

      const previousRules = queryClient.getQueryData<ValidationRule[]>(ruleKeys.list({}));

      if (previousRules) {
        queryClient.setQueryData<ValidationRule[]>(
          ruleKeys.list({}),
          previousRules.map((r) =>
            ids.includes(r.id) ? { ...r, isActive: active } : r
          )
        );
      }

      return { previousRules };
    },
    onError: (err, _, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(ruleKeys.list({}), context.previousRules);
      }
      addToast('Erreur lors de la modification en masse', 'error');
    },
    onSuccess: (_, { ids, active }) => {
      addToast(
        `${ids.length} règles ${active ? 'activées' : 'désactivées'}`,
        'success'
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => rulesApi.bulkDelete(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ruleKeys.lists() });

      const previousRules = queryClient.getQueryData<ValidationRule[]>(ruleKeys.list({}));

      if (previousRules) {
        queryClient.setQueryData<ValidationRule[]>(
          ruleKeys.list({}),
          previousRules.filter((r) => !ids.includes(r.id))
        );
      }

      return { previousRules };
    },
    onError: (err, _, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(ruleKeys.list({}), context.previousRules);
      }
      addToast('Erreur lors de la suppression en masse', 'error');
    },
    onSuccess: (_, ids) => {
      addToast(`${ids.length} règles supprimées`, 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });

  return { bulkToggle, bulkDelete };
};

/**
 * Hook for updating rule priorities (drag & drop)
 */
export const useUpdatePriorities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (priorities: { id: string; priority: number }[]) =>
      rulesApi.updatePriorities(priorities),
    onMutate: async (priorities) => {
      await queryClient.cancelQueries({ queryKey: ruleKeys.lists() });

      const previousRules = queryClient.getQueryData<ValidationRule[]>(ruleKeys.list({}));

      if (previousRules) {
        const priorityMap = new Map(priorities.map((p) => [p.id, p.priority]));
        queryClient.setQueryData<ValidationRule[]>(
          ruleKeys.list({}),
          previousRules.map((r) => ({
            ...r,
            priority: priorityMap.get(r.id) ?? r.priority,
          }))
        );
      }

      return { previousRules };
    },
    onError: (err, _, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(ruleKeys.list({}), context.previousRules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};
