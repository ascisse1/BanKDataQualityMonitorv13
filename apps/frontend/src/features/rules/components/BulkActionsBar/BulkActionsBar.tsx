import React from 'react';
import { X, CheckSquare, XSquare, Trash2, Download, MoreHorizontal } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onActivate,
  onDeactivate,
  onDelete,
  onExport,
  isLoading = false,
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-2xl">
            {/* Selection count */}
            <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-lg font-semibold">
                {selectedCount}
              </div>
              <span className="text-sm text-gray-300">
                sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onActivate}
                disabled={isLoading}
                className="text-white hover:bg-gray-700"
                leftIcon={<CheckSquare className="w-4 h-4" />}
              >
                Activer
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDeactivate}
                disabled={isLoading}
                className="text-white hover:bg-gray-700"
                leftIcon={<XSquare className="w-4 h-4" />}
              >
                Désactiver
              </Button>

              {onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  disabled={isLoading}
                  className="text-white hover:bg-gray-700"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Exporter
                </Button>
              )}

              <div className="w-px h-6 bg-gray-700" />

              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isLoading}
                className="text-error-400 hover:bg-error-900/30 hover:text-error-300"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Supprimer
              </Button>
            </div>

            {/* Clear selection */}
            <div className="pl-3 border-l border-gray-700">
              <button
                onClick={onClearSelection}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Annuler la sélection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionsBar;
