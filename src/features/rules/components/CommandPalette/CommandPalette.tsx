import React, { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import {
  Plus,
  Search,
  Download,
  ToggleLeft,
  Trash2,
  RefreshCw,
  Settings,
  FileCode,
  TestTube,
  Database,
  Filter,
  CheckSquare,
  XSquare,
  Keyboard
} from 'lucide-react';
import './CommandPalette.css';

export interface CommandItem {
  id: string;
  name: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  group?: string;
}

interface CommandPaletteProps {
  commands: CommandItem[];
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  placeholder = 'Rechercher une commande...',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Toggle the menu when ⌘K or Ctrl+K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Direct shortcuts when palette is closed
      if (!open) {
        const matchingCommand = commands.find(cmd => {
          if (!cmd.shortcut) return false;
          const shortcut = cmd.shortcut.toLowerCase();
          return shortcut === e.key.toLowerCase() && !e.metaKey && !e.ctrlKey && !e.altKey;
        });

        if (matchingCommand && document.activeElement?.tagName !== 'INPUT' &&
            document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          matchingCommand.action();
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, commands]);

  const handleSelect = useCallback((commandId: string) => {
    const command = commands.find(cmd => cmd.id === commandId);
    if (command) {
      command.action();
      setOpen(false);
      setSearch('');
    }
  }, [commands]);

  // Group commands
  const groupedCommands = commands.reduce((acc, cmd) => {
    const group = cmd.group || 'Actions';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setOpen(false)}>
      <div className="command-palette-container" onClick={(e) => e.stopPropagation()}>
        <Command className="command-palette" shouldFilter={true}>
          <div className="command-palette-header">
            <Search className="command-palette-search-icon" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={placeholder}
              className="command-palette-input"
              autoFocus
            />
            <kbd className="command-palette-kbd">ESC</kbd>
          </div>

          <Command.List className="command-palette-list">
            <Command.Empty className="command-palette-empty">
              Aucune commande trouvée.
            </Command.Empty>

            {Object.entries(groupedCommands).map(([group, items]) => (
              <Command.Group key={group} heading={group} className="command-palette-group">
                {items.map((command) => (
                  <Command.Item
                    key={command.id}
                    value={`${command.name} ${command.keywords?.join(' ') || ''}`}
                    onSelect={() => handleSelect(command.id)}
                    className="command-palette-item"
                  >
                    <div className="command-palette-item-content">
                      {command.icon && (
                        <span className="command-palette-item-icon">
                          {command.icon}
                        </span>
                      )}
                      <span className="command-palette-item-name">{command.name}</span>
                    </div>
                    {command.shortcut && (
                      <kbd className="command-palette-item-shortcut">
                        {command.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="command-palette-footer">
            <div className="command-palette-footer-hint">
              <Keyboard className="w-3 h-3" />
              <span>Utilisez les flèches pour naviguer</span>
            </div>
            <div className="command-palette-footer-hint">
              <span>Entrée pour sélectionner</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
};

// Hook to create default rule commands
export const useRuleCommands = ({
  onNewRule,
  onRefresh,
  onExport,
  onToggleAll,
  onSearch,
  onSwitchTab,
  selectedCount = 0,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
}: {
  onNewRule: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onToggleAll?: (active: boolean) => void;
  onSearch?: () => void;
  onSwitchTab?: (tab: string) => void;
  selectedCount?: number;
  onBulkActivate?: () => void;
  onBulkDeactivate?: () => void;
  onBulkDelete?: () => void;
}): CommandItem[] => {
  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'tab-rules',
      name: 'Aller aux Règles de Validation',
      shortcut: '1',
      icon: <Settings className="w-4 h-4" />,
      action: () => onSwitchTab?.('rules'),
      keywords: ['validation', 'règles'],
      group: 'Navigation',
    },
    {
      id: 'tab-database',
      name: 'Aller aux Règles Base de Données',
      shortcut: '2',
      icon: <Database className="w-4 h-4" />,
      action: () => onSwitchTab?.('database'),
      keywords: ['database', 'base'],
      group: 'Navigation',
    },
    {
      id: 'tab-sql',
      name: 'Aller aux Requêtes SQL',
      shortcut: '3',
      icon: <FileCode className="w-4 h-4" />,
      action: () => onSwitchTab?.('sql'),
      keywords: ['sql', 'requêtes'],
      group: 'Navigation',
    },
    {
      id: 'tab-test',
      name: 'Aller au Testeur',
      shortcut: '4',
      icon: <TestTube className="w-4 h-4" />,
      action: () => onSwitchTab?.('test'),
      keywords: ['test', 'testeur'],
      group: 'Navigation',
    },

    // Actions
    {
      id: 'new-rule',
      name: 'Nouvelle Règle',
      shortcut: 'n',
      icon: <Plus className="w-4 h-4" />,
      action: onNewRule,
      keywords: ['créer', 'ajouter', 'nouveau'],
      group: 'Actions',
    },
    {
      id: 'refresh',
      name: 'Actualiser les données',
      shortcut: 'r',
      icon: <RefreshCw className="w-4 h-4" />,
      action: onRefresh,
      keywords: ['rafraîchir', 'recharger'],
      group: 'Actions',
    },
    {
      id: 'export',
      name: 'Exporter les règles',
      shortcut: 'e',
      icon: <Download className="w-4 h-4" />,
      action: onExport,
      keywords: ['télécharger', 'download'],
      group: 'Actions',
    },
    {
      id: 'search',
      name: 'Rechercher',
      shortcut: '/',
      icon: <Search className="w-4 h-4" />,
      action: () => onSearch?.(),
      keywords: ['filtrer', 'trouver'],
      group: 'Actions',
    },
  ];

  // Add bulk actions if items are selected
  if (selectedCount > 0) {
    commands.push(
      {
        id: 'bulk-activate',
        name: `Activer ${selectedCount} règle(s) sélectionnée(s)`,
        icon: <CheckSquare className="w-4 h-4" />,
        action: () => onBulkActivate?.(),
        keywords: ['activer', 'enable'],
        group: 'Actions en masse',
      },
      {
        id: 'bulk-deactivate',
        name: `Désactiver ${selectedCount} règle(s) sélectionnée(s)`,
        icon: <XSquare className="w-4 h-4" />,
        action: () => onBulkDeactivate?.(),
        keywords: ['désactiver', 'disable'],
        group: 'Actions en masse',
      },
      {
        id: 'bulk-delete',
        name: `Supprimer ${selectedCount} règle(s) sélectionnée(s)`,
        icon: <Trash2 className="w-4 h-4" />,
        action: () => onBulkDelete?.(),
        keywords: ['supprimer', 'effacer'],
        group: 'Actions en masse',
      }
    );
  }

  // Add toggle all if handler provided
  if (onToggleAll) {
    commands.push(
      {
        id: 'activate-all',
        name: 'Activer toutes les règles',
        shortcut: 'a',
        icon: <ToggleLeft className="w-4 h-4" />,
        action: () => onToggleAll(true),
        keywords: ['enable', 'activer'],
        group: 'Actions globales',
      },
      {
        id: 'deactivate-all',
        name: 'Désactiver toutes les règles',
        shortcut: 'd',
        icon: <ToggleLeft className="w-4 h-4" />,
        action: () => onToggleAll(false),
        keywords: ['disable', 'désactiver'],
        group: 'Actions globales',
      }
    );
  }

  return commands;
};

export default CommandPalette;
