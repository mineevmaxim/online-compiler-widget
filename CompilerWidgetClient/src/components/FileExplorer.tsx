import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import cls from "./FileExplorer.module.scss";
import DocumentIcon from "../assets/documentIcon.svg?react";
import FolderIcon from "../assets/folder.svg?react";
import PlusIcon from "../assets/plus.svg?react";
import type { EditorDocument } from "../types/EditorDocument";

interface FileExplorerProps {
    documents: EditorDocument[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: (fileName: string, parentPath?: string) => void; // Изменено: принимает путь
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onMove: (fileId: string, newPath: string) => void;
}

// Типы для папок
export interface Folder {
    id: string;
    name: string;
    type: 'folder';
    path: string;
    isExpanded?: boolean;
    children?: TreeItem[];
}

interface FileItem {
    id: string;
    name: string;
    type: 'file';
    path: string;
    modified?: boolean;
}

type TreeItem = Folder | FileItem;

// Компонент модального окна для создания файла/папки
interface CreateItemModalProps {
    isOpen: boolean;
    type: 'file' | 'folder' | null;
    currentPath?: string;
    onClose: () => void;
    onConfirm: (itemName: string, itemType: 'file' | 'folder') => void;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({ 
    isOpen, 
    type, 
    currentPath,
    onClose, 
    onConfirm 
}) => {
    const [itemName, setItemName] = useState("");
    const [error, setError] = useState("");
    
    if (!isOpen || !type) return null;
    
    const isFile = type === 'file';
    const title = isFile ? "Создать новый файл" : "Создать новую папку";
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const trimmedName = itemName.trim();
        
        if (!trimmedName) {
            setError("Введите имя");
            return;
        }
        
        if (isFile) {
            // Проверяем расширение для файла
            if (!trimmedName.includes('.')) {
                setError("Добавьте расширение файла (например, .cs, .js, .txt)");
                return;
            }
            
            // Проверяем допустимые расширения
            const validExtensions = ['.cs', '.js', '.txt'];
            const hasValidExtension = validExtensions.some(ext => trimmedName.endsWith(ext));
            
            if (!hasValidExtension) {
                setError(`Используйте одно из расширений: ${validExtensions.join(', ')}`);
                return;
            }
        }
        
        onConfirm(trimmedName, type);
        setItemName("");
        setError("");
    };
    
    const handleClose = () => {
        setItemName("");
        setError("");
        onClose();
    };
    
    return (
        <div className={cls.modalOverlay} onClick={handleClose}>
            <div className={cls.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                {currentPath && currentPath !== "/" && (
                    <div className={cls.modalSubtitle}>
                        Расположение: {currentPath}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className={cls.formGroup}>
                        <label htmlFor="itemName">
                            {isFile ? "Имя файла с расширением:" : "Имя папки:"}
                        </label>
                        <input
                            id="itemName"
                            type="text"
                            value={itemName}
                            onChange={(e) => {
                                setItemName(e.target.value);
                                setError("");
                            }}
                            placeholder={isFile ? "Например: program.cs" : "Например: utils"}
                            autoFocus
                            className={error ? cls.error : ""}
                        />
                        {isFile ? (
                            <div className={cls.helpText}>
                                Введите имя файла с расширением (.cs, .js, .txt)
                            </div>
                        ) : (
                            <div className={cls.helpText}>
                                Введите имя папки
                            </div>
                        )}
                        {error && <div className={cls.errorMessage}>{error}</div>}
                    </div>
                    <div className={cls.modalActions}>
                        <button 
                            type="button" 
                            onClick={handleClose}
                            className={cls.cancelBtn}
                        >
                            Отмена
                        </button>
                        <button 
                            type="submit" 
                            className={cls.confirmBtn}
                            disabled={!itemName.trim()}
                        >
                            Создать
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Компонент для отображения элемента дерева
interface FileItemProps {
    item: TreeItem;
    level: number;
    isSelected: boolean;
    isEditing: boolean;
    editName: string;
    onSelect: () => void;
    onToggleFolder?: () => void;
    onStartRename: () => void;
    onDelete: () => void;
    onSaveRename: (newName: string) => void;
    onCancelRename: () => void;
    onSetMenuId: () => void;
    onOpenCreateModal: (type: 'file' | 'folder') => void;
    showMenu: boolean;
    isFolder?: boolean;
    isExpanded?: boolean;
    onEditNameChange: (name: string) => void;
    onDragStart: (e: React.DragEvent, itemId: string, itemType: 'file' | 'folder') => void;
    onDragOver: (e: React.DragEvent, itemId: string) => void;
    onDrop: (e: React.DragEvent, itemId: string) => void;
    isDragOver?: boolean;
    isDragging?: boolean;
}

const FileItemComponent: React.FC<FileItemProps> = ({
    item,
    level,
    isSelected,
    isEditing,
    editName,
    onSelect,
    onToggleFolder,
    onStartRename,
    onDelete,
    onSaveRename,
    onCancelRename,
    onSetMenuId,
    onOpenCreateModal,
    showMenu,
    isFolder = false,
    isExpanded = false,
    onEditNameChange,
    onDragStart,
    onDragOver,
    onDrop,
    isDragOver = false,
    isDragging = false
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSaveRename(editName);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancelRename();
        }
    };

    const handleBlur = () => {
        setTimeout(() => {
            onSaveRename(editName);
        }, 100);
    };

    return (
        <li
            className={`${cls.fileItem} ${isSelected ? cls.selected : ""} ${isFolder ? cls.folderItem : ""} ${isDragOver ? cls.dragOver : ""} ${isDragging ? cls.dragging : ""}`}
            style={{ paddingLeft: `${level * 16}px` }}
            onClick={(e) => {
                e.stopPropagation();
                if (!isEditing) {
                    onSelect();
                    if (isFolder && onToggleFolder) {
                        onToggleFolder();
                    }
                }
            }}
            draggable={!isEditing && item.type === 'file'}
            onDragStart={(e) => onDragStart(e, item.id, item.type)}
            onDragOver={(e) => {
                e.preventDefault();
                if (isFolder && item.type === 'folder') {
                    onDragOver(e, item.id);
                }
            }}
            onDragLeave={(e) => {
                e.currentTarget.classList.remove(cls.dragOver);
            }}
            onDrop={(e) => {
                e.preventDefault();
                if (isFolder && item.type === 'folder') {
                    onDrop(e, item.id);
                }
                e.currentTarget.classList.remove(cls.dragOver);
            }}
        >
            <div className={cls.clickZone}>
                {isFolder && (
                    <span 
                        className={cls.folderToggle}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleFolder) onToggleFolder();
                        }}
                    >
                        {isExpanded ? '▼' : '▶'}
                    </span>
                )}
                
                <span className={cls.itemIcon}>
                    {isFolder ? (
                        <FolderIcon className={cls.folderIcon} />
                    ) : (
                        <span className={cls.fileIcon}>📄</span>
                    )}
                </span>
                
                {isEditing ? (
                    <div className={cls.editContainer}>
                        <input
                            ref={inputRef}
                            type="text"
                            className={cls.editInput}
                            value={editName}
                            onChange={(e) => onEditNameChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                ) : (
                    <div className={cls.nameContainer}>
                        <span className={cls.itemText}>{item.name}</span>
                        {!isFolder && (item as FileItem).modified && (
                            <span 
                                className={cls.modifiedDot} 
                                title="Файл изменен (не сохранен)"
                            >
                                ●
                            </span>
                        )}
                    </div>
                )}
            </div>

            {!isEditing && (
                <button
                    className={cls.moreBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSetMenuId();
                    }}
                    title={`Действия с ${isFolder ? 'папкой' : 'файлом'}`}
                >
                    ⋮
                </button>
            )}

            {showMenu && (
                <div className={cls.contextMenu} ref={menuRef}>
                    <div
                        className={cls.menuItem}
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartRename();
                        }}
                    >
                        Переименовать
                    </div>
                    {isFolder && (
                        <>
                            <div
                                className={cls.menuItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCreateModal('file');
                                }}
                            >
                                Новый файл
                            </div>
                            <div
                                className={cls.menuItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCreateModal('folder');
                                }}
                            >
                                Новая папка
                            </div>
                        </>
                    )}
                    <div className={cls.menuDivider} />
                    <div
                        className={`${cls.menuItem} ${cls.deleteItem}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        Удалить
                    </div>
                </div>
            )}
        </li>
    );
};

// Функция для построения дерева из путей
const buildTreeFromPaths = (folders: Folder[], fileItems: FileItem[]): TreeItem[] => {
    // Создаем мапу для быстрого доступа к элементам по пути
    const itemsByPath = new Map<string, TreeItem>();
    const itemsByParentPath = new Map<string, TreeItem[]>();
    
    // Добавляем папки
    folders.forEach(folder => {
        itemsByPath.set(folder.path, folder);
        
        const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/')) || '/';
        if (!itemsByParentPath.has(parentPath)) {
            itemsByParentPath.set(parentPath, []);
        }
        itemsByParentPath.get(parentPath)!.push(folder);
    });
    
    // Добавляем файлы
    fileItems.forEach(file => {
        itemsByPath.set(file.path, file);
        
        const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
        if (!itemsByParentPath.has(parentPath)) {
            itemsByParentPath.set(parentPath, []);
        }
        itemsByParentPath.get(parentPath)!.push(file);
    });
    
    // Рекурсивная функция для построения дерева
    const buildTreeForPath = (path: string): TreeItem[] => {
        const items = itemsByParentPath.get(path) || [];
        
        // Сортируем: сначала папки, потом файлы по алфавиту
        return items.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
    };
    
    // Строим дерево для корня
    return buildTreeForPath('/');
};

// Рекурсивный компонент для отображения дерева
interface TreeViewProps {
    items: TreeItem[];
    level: number;
    selectedId: string | null;
    menuId: string | null;
    editingId: string | null;
    editName: string;
    onSelect: (id: string) => void;
    onToggleFolder: (folderId: string, path: string) => void;
    onStartRename: (id: string, currentName: string) => void;
    onSaveRename: (id: string, newName: string) => void;
    onCancelRename: () => void;
    onDelete: (id: string) => void;
    onSetMenuId: (id: string | null) => void;
    onOpenCreateModal: (type: 'file' | 'folder', itemId?: string, path?: string) => void;
    onEditNameChange: (name: string) => void;
    onDragStart: (e: React.DragEvent, itemId: string, itemType: 'file' | 'folder') => void;
    onDragOver: (e: React.DragEvent, itemId: string) => void;
    onDrop: (e: React.DragEvent, itemId: string) => void;
    dragOverItemId: string | null;
    draggedItemId: string | null;
    expandedFolders: Set<string>;
}

const TreeView: React.FC<TreeViewProps> = ({
    items,
    level,
    selectedId,
    menuId,
    editingId,
    editName,
    onSelect,
    onToggleFolder,
    onStartRename,
    onSaveRename,
    onCancelRename,
    onDelete,
    onSetMenuId,
    onOpenCreateModal,
    onEditNameChange,
    onDragStart,
    onDragOver,
    onDrop,
    dragOverItemId,
    draggedItemId,
    expandedFolders
}) => {
    return (
        <>
            {items.map(item => {
                const isFolder = item.type === 'folder';
                const folderItem = item as Folder;
                const isExpanded = isFolder && expandedFolders.has(item.path);
                
                return (
                    <React.Fragment key={item.id}>
                        <FileItemComponent
                            item={item}
                            level={level}
                            isSelected={selectedId === item.id}
                            isEditing={editingId === item.id}
                            editName={editName}
                            onSelect={() => onSelect(item.id)}
                            onToggleFolder={isFolder ? () => onToggleFolder(item.id, item.path) : undefined}
                            onStartRename={() => onStartRename(item.id, item.name)}
                            onDelete={() => onDelete(item.id)}
                            onSaveRename={(newName) => onSaveRename(item.id, newName)}
                            onCancelRename={onCancelRename}
                            onSetMenuId={() => onSetMenuId(menuId === item.id ? null : item.id)}
                            onOpenCreateModal={(type) => onOpenCreateModal(type, item.id, item.path)}
                            showMenu={menuId === item.id}
                            isFolder={isFolder}
                            isExpanded={isExpanded}
                            onEditNameChange={onEditNameChange}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            isDragOver={dragOverItemId === item.id}
                            isDragging={draggedItemId === item.id}
                        />
                        
                        {/* Рекурсивно отображаем детей для развернутых папок */}
                        {isFolder && isExpanded && item.children && (
                            <TreeView
                                items={item.children}
                                level={level + 1}
                                selectedId={selectedId}
                                menuId={menuId}
                                editingId={editingId}
                                editName={editName}
                                onSelect={onSelect}
                                onToggleFolder={onToggleFolder}
                                onStartRename={onStartRename}
                                onSaveRename={onSaveRename}
                                onCancelRename={onCancelRename}
                                onDelete={onDelete}
                                onSetMenuId={onSetMenuId}
                                onOpenCreateModal={onOpenCreateModal}
                                onEditNameChange={onEditNameChange}
                                onDragStart={onDragStart}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                                dragOverItemId={dragOverItemId}
                                draggedItemId={draggedItemId}
                                expandedFolders={expandedFolders}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
    documents,
    selectedId,
    onSelect,
    onAdd,
    onRename,
    onDelete,
    onMove
}) => {
    const [menuId, setMenuId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createModalType, setCreateModalType] = useState<'file' | 'folder' | null>(null);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [currentPathForCreate, setCurrentPathForCreate] = useState<string>("");
    
    // Состояние для перетаскивания
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
    
    // Состояние папок (теперь пустое, папки будут создаваться из документов)
    const [folders, setFolders] = useState<Folder[]>([]);
    
    // Состояние развернутости папок
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    
    const createMenuRef = useRef<HTMLDivElement | null>(null);
    const addButtonRef = useRef<HTMLButtonElement | null>(null);

    // Закрытие меню при клике вне
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
                if (addButtonRef.current && !addButtonRef.current.contains(e.target as Node)) {
                    setShowCreateMenu(false);
                }
            }
            
            const target = e.target as Element;
            const isMoreButton = target.closest(`.${cls.moreBtn}`);
            const isInContextMenu = target.closest(`.${cls.contextMenu}`);
            
            if (!isMoreButton && !isInContextMenu) {
                setMenuId(null);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Функция для нормализации пути (добавляет / в конце если не пустой)
    const normalizePath = (path: string): string => {
    if (!path) return '';
    return path.endsWith('/') ? path : `${path}/`;
};

    // Создаем папки на основе путей из документов
    const allFolders = useMemo(() => {
        const folderSet = new Map<string, Folder>();
        
        // Добавляем папки из состояния (созданные пользователем)
        folders.forEach(folder => {
            folderSet.set(folder.path, folder);
        });
        
        // Добавляем папки из путей документов
        documents.forEach(doc => {
            if (doc.path) {
                // Разбиваем путь на части
                const parts = doc.path.split('/').filter(Boolean);
                let currentPath = '';
                
                // Создаем все родительские папки
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    const folderPath = currentPath + '/';
                    
                    if (!folderSet.has(folderPath)) {
                        folderSet.set(folderPath, {
                            id: `folder-${folderPath}`,
                            name: part,
                            type: 'folder',
                            path: folderPath,
                            isExpanded: expandedFolders.has(folderPath)
                        });
                    }
                }
            }
        });
        
        return Array.from(folderSet.values());
    }, [folders, documents, expandedFolders]);

    // Преобразуем документы в формат файлов для дерева
    const fileItems: FileItem[] = useMemo(() => 
        documents.map(doc => {
            // Нормализуем путь папки
            const folderPath = normalizePath(doc.path);
            // Полный путь к файлу
            const fullPath = folderPath ? `${folderPath}${doc.name}` : doc.name;
            
            return {
                id: doc.id,
                name: doc.name,
                type: 'file' as const,
                path: fullPath,
                modified: doc.modified
            };
        }), 
    [documents]);

    // Строим дерево из путей
    const treeItems = useMemo(() => {
    // Создаем мапу всех элементов по их пути
    const allItemsMap = new Map<string, TreeItem>();
    
    // Добавляем папки
    allFolders.forEach(folder => {
        allItemsMap.set(folder.path, { ...folder, children: [] });
    });
    
    // Добавляем файлы
    fileItems.forEach(file => {
        allItemsMap.set(file.path, file);
    });
    
    // Создаем дерево
    const rootItems: TreeItem[] = [];
    const processedItems = new Set<string>();
    
    // Функция для получения или создания родительской папки
    const ensureParentFolders = (itemPath: string): void => {
        const parts = itemPath.split('/').filter(Boolean);
        let currentPath = '';
        
        // Пропускаем последнюю часть (имя файла/папки)
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const folderPath = `${currentPath}/`;
            
            // Если папки еще нет, создаем ее
            if (!allItemsMap.has(folderPath) && !processedItems.has(folderPath)) {
                const folder: Folder = {
                    id: `folder-auto-${folderPath}`,
                    name: part,
                    type: 'folder',
                    path: folderPath,
                    isExpanded: expandedFolders.has(folderPath)
                };
                allItemsMap.set(folderPath, { ...folder, children: [] });
            }
        }
    };
    
    // Сначала создаем все необходимые папки
    fileItems.forEach(file => {
        ensureParentFolders(file.path);
    });
    
    // Теперь строим иерархию
    const itemsByParentPath = new Map<string, TreeItem[]>();
    
    // Собираем все элементы по родительским путям
    Array.from(allItemsMap.values()).forEach(item => {
        // Определяем родительский путь
        let parentPath = '';
        
        if (item.path === '/') {
            // Корневой элемент
            parentPath = '';
        } else {
            const lastSlashIndex = item.path.lastIndexOf('/', item.path.length - 2);
            parentPath = lastSlashIndex === -1 ? '' : item.path.substring(0, lastSlashIndex + 1);
        }
        
        if (!itemsByParentPath.has(parentPath)) {
            itemsByParentPath.set(parentPath, []);
        }
        
        itemsByParentPath.get(parentPath)!.push(item);
        processedItems.add(item.path);
    });
    
    // Рекурсивная функция для построения дерева с детьми
    const buildTree = (parentPath: string): TreeItem[] => {
        const items = itemsByParentPath.get(parentPath) || [];
        
        // Сортируем: сначала папки, потом файлы
        const sortedItems = items.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        
        // Для каждого элемента добавляем детей
        return sortedItems.map(item => {
            if (item.type === 'folder') {
                const folderItem = item as Folder & { children?: TreeItem[] };
                return {
                    ...folderItem,
                    children: buildTree(folderItem.path)
                };
            }
            return item;
        });
    };
    
    return buildTree(''); // Корневой путь
}, [allFolders, fileItems, expandedFolders]);

    const handleStartRename = useCallback((id: string, currentName: string) => {
        setMenuId(null);
        setEditingId(id);
        setEditName(currentName);
    }, []);

    const handleSaveRename = useCallback((id: string, newName: string) => {
        if (newName.trim()) {
            // Проверяем, папка это или файл
            const isFolder = allFolders.some(f => f.id === id);
            if (isFolder) {
                const folder = allFolders.find(f => f.id === id);
                if (folder) {
                    // Обновляем путь папки
                    const oldPath = folder.path;
                    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/', oldPath.length - 2)) || '';
                    const newPath = parentPath ? `${parentPath}/${newName.trim()}/` : `${newName.trim()}/`;
                    
                    // Обновляем папку в состоянии
                    setFolders(prev => prev.map(f => 
                        f.id === id 
                            ? { ...f, name: newName.trim(), path: newPath }
                            : f
                    ));
                    
                    // Обновляем состояние развернутости
                    if (expandedFolders.has(oldPath)) {
                        setExpandedFolders(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(oldPath);
                            newSet.add(newPath);
                            return newSet;
                        });
                    }
                }
            } else {
                onRename(id, newName.trim());
            }
        }
        setEditingId(null);
        setEditName("");
    }, [allFolders, onRename, expandedFolders]);

    const handleCancelRename = useCallback(() => {
        setEditingId(null);
        setEditName("");
    }, []);

    const handleToggleFolder = useCallback((folderId: string, path: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            console.log(documents)
            return newSet;
        });
    }, []);

    const handleDeleteItem = useCallback((id: string) => {
        const isFolder = allFolders.some(f => f.id === id);
        if (isFolder) {
            const folder = allFolders.find(f => f.id === id);
            if (folder) {
                // Удаляем папку из состояния
                setFolders(prev => prev.filter(f => f.id !== id));
                // Удаляем из развернутых
                setExpandedFolders(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(folder.path);
                    return newSet;
                });
            }
        } else {
            onDelete(id);
        }
        setMenuId(null);
    }, [allFolders, onDelete]);

    const handleAddItem = (itemName: string, itemType: 'file' | 'folder') => {
        if (itemType === 'file') {
            // Для файла передаем имя и нормализованный путь
            const folderPath = normalizePath(currentPathForCreate);
            console.log(currentPathForCreate)
            console.log(folderPath)
            onAdd(itemName, folderPath);
        } else {
            // Для папки создаем новый объект
            const folderPath = currentPathForCreate ? 
                `${normalizePath(currentPathForCreate)}${itemName}/` : 
                `${itemName}/`;
            
            const newFolder: Folder = {
                id: `folder-${Date.now()}`,
                name: itemName,
                type: 'folder',
                path: folderPath,
                isExpanded: false
            };
            
            
            setFolders(prev => [...prev, newFolder]);
            // Автоматически разворачиваем новую папку
            setExpandedFolders(prev => new Set([...prev, folderPath]));
        }
        
        setShowCreateModal(false);
        setCreateModalType(null);
        setCurrentPathForCreate("");
    };

    const handleCreateMenuSelect = (type: 'file' | 'folder', itemId?: string, path?: string) => {
        setCreateModalType(type);
        setCurrentPathForCreate(path || "");
        setShowCreateModal(true);
        setShowCreateMenu(false);
        setMenuId(null);
    };

    const handleEditNameChange = useCallback((name: string) => {
        setEditName(name);
    }, []);

    // Обработчики для перетаскивания
    const handleDragStart = useCallback((e: React.DragEvent, itemId: string, itemType: 'file' | 'folder') => {
        if (itemType !== 'file') return;
        
        e.dataTransfer.setData('text/plain', itemId);
        setDraggedItemId(itemId);
        e.dataTransfer.effectAllowed = 'move';
        
        requestAnimationFrame(() => {
            const element = e.currentTarget as HTMLElement;
            if (element && element.classList) {
                element.classList.add(cls.dragging);
            }
        });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        const isFolder = allFolders.some(f => f.id === folderId);
        if (isFolder && folderId !== dragOverItemId) {
            setDragOverItemId(folderId);
        }
        e.dataTransfer.dropEffect = 'move';
    }, [allFolders, dragOverItemId]);

    const handleDrop = useCallback((e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        const draggedFileId = e.dataTransfer.getData('text/plain');
        
        if (!draggedFileId || draggedFileId === folderId) {
            setDragOverItemId(null);
            setDraggedItemId(null);
            return;
        }
        
        const targetFolder = allFolders.find(f => f.id === folderId);
        const draggedFile = documents.find(d => d.id === draggedFileId);
        
        if (targetFolder && draggedFile) {
            // Вызываем onMove с нормализованным путем к папке
            onMove(draggedFileId, targetFolder.path);
            
            // Разворачиваем папку, если она была свернута
            if (!expandedFolders.has(targetFolder.path)) {
                setExpandedFolders(prev => new Set([...prev, targetFolder.path]));
            }
        }
        
        setDragOverItemId(null);
        setDraggedItemId(null);
        
        document.querySelectorAll(`.${cls.dragging}`).forEach(el => {
            if (el && el.classList) {
                el.classList.remove(cls.dragging);
            }
        });
    }, [allFolders, documents, onMove, expandedFolders]);

    const handleDragEnd = useCallback(() => {
        setDraggedItemId(null);
        setDragOverItemId(null);
        
        document.querySelectorAll(`.${cls.dragging}`).forEach(el => {
            if (el && el.classList) {
                el.classList.remove(cls.dragging);
            }
        });
    }, []);

    useEffect(() => {
        const handleDocumentDragEnd = () => {
            handleDragEnd();
        };

        document.addEventListener('dragend', handleDocumentDragEnd);
        return () => {
            document.removeEventListener('dragend', handleDocumentDragEnd);
        };
    }, [handleDragEnd]);

    return (
        <div 
            className={cls.fileExplorer}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                handleDragEnd();
            }}
        >
            <CreateItemModal 
                isOpen={showCreateModal}
                type={createModalType}
                currentPath={currentPathForCreate}
                onClose={() => {
                    setShowCreateModal(false);
                    setCreateModalType(null);
                    setCurrentPathForCreate("");
                }}
                onConfirm={handleAddItem}
            />
            
            <div className={cls.header}>
                <DocumentIcon className={cls.documentIcon} />
                <span>Файлы</span>
                <div className={cls.addButtonWrapper}>
                    <button 
                        ref={addButtonRef}
                        onClick={() => setShowCreateMenu(!showCreateMenu)} 
                        className={cls.addButton}
                        title="Создать файл или папку"
                    >
                        <PlusIcon className={cls.plusIcon} />
                    </button>
                    
                    {showCreateMenu && (
                        <div className={cls.contextMenu} ref={createMenuRef}>
                            <div
                                className={cls.menuItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateMenuSelect('file');
                                }}
                            >
                                Создать файл
                            </div>
                            <div
                                className={cls.menuItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateMenuSelect('folder');
                                }}
                            >
                                Создать папку
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ul className={cls.fileList}>
                <TreeView
                    items={treeItems}
                    level={0}
                    selectedId={selectedId}
                    menuId={menuId}
                    editingId={editingId}
                    editName={editName}
                    onSelect={onSelect}
                    onToggleFolder={handleToggleFolder}
                    onStartRename={handleStartRename}
                    onSaveRename={handleSaveRename}
                    onCancelRename={handleCancelRename}
                    onDelete={handleDeleteItem}
                    onSetMenuId={setMenuId}
                    onOpenCreateModal={handleCreateMenuSelect}
                    onEditNameChange={handleEditNameChange}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    dragOverItemId={dragOverItemId}
                    draggedItemId={draggedItemId}
                    expandedFolders={expandedFolders}
                />
            </ul>
        </div>
    );
};