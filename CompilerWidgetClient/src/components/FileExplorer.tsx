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
    onAdd: (fileName: string, parentPath?: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onMove: (fileId: string, newPath: string) => void;
    onFolderRename: (id: string, oldPath: string, newPath: string) => void;
    changeAllDocPath: (oldPath: string, newPath: string) => void;
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
            if (!trimmedName.includes('.')) {
                setError("Добавьте расширение файла (например, .cs, .js, .txt)");
                return;
            }
            
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
                                Введите имя файла с расширением (.cs, .txt)
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
    documents: externalDocuments,
    selectedId,
    onSelect,
    onAdd,
    onRename,
    onDelete,
    onMove,
    onFolderRename,
    changeAllDocPath
}) => {
    // Локальное состояние для документов (для оптимистичного обновления)
    const [localDocuments, setLocalDocuments] = useState<EditorDocument[]>(externalDocuments);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    
    const [menuId, setMenuId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createModalType, setCreateModalType] = useState<'file' | 'folder' | null>(null);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [currentPathForCreate, setCurrentPathForCreate] = useState<string>("");
    
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
    const [dragOverRoot, setDragOverRoot] = useState(false);
    
    const createMenuRef = useRef<HTMLDivElement | null>(null);
    const addButtonRef = useRef<HTMLButtonElement | null>(null);

    // Синхронизация с внешними документами
    useEffect(() => {
        setLocalDocuments(externalDocuments);
    }, [externalDocuments]);


    const normalizePath = useCallback((path: string): string => {
    if (!path) return '';
    
    let normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/');
    normalized = normalized.startsWith('/') ? normalized.substring(1) : normalized;
    
    if (normalized && !normalized.endsWith('/') && !path.includes('.')) {
        normalized += '/';
    }
    
    return normalized;
}, []);

    // Функция для получения пути папки из полного пути
    const getFolderPath = useCallback((fullPath: string): string => {
        const normalized = normalizePath(fullPath);
        const lastSlashIndex = normalized.lastIndexOf('/');
        
        if (lastSlashIndex === -1) {
            return '';
        }
        
        return normalized.substring(0, lastSlashIndex + 1);
    }, [normalizePath]);

    // Создаем папки на основе путей из документов
    const allFolders = useMemo(() => {

        
        const folderSet = new Map<string, Folder>();
        
        // Добавляем пользовательские папки
        folders.forEach(folder => {
            const normalizedPath = normalizePath(folder.path);
            folderSet.set(normalizedPath, { ...folder, path: normalizedPath });
        });
        
        // Добавляем папки из путей документов
        const folderPaths = new Set<string>();
        
        localDocuments.forEach(doc => {
            if (doc.path) {
                const folderPath = getFolderPath(doc.path);
                if (folderPath) {
                    folderPaths.add(folderPath);
                    
                    // Создаем все родительские папки
                    let currentPath = '';
                    const parts = folderPath.split('/').filter(Boolean);
                    
                    for (let i = 0; i < parts.length; i++) {
                        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
                        const parentFolderPath = `${currentPath}/`;
                        
                        if (!folderSet.has(parentFolderPath)) {
                            folderSet.set(parentFolderPath, {
                                id: `folder-auto-${parentFolderPath}`,
                                name: parts[i],
                                type: 'folder' as const,
                                path: parentFolderPath,
                                isExpanded: expandedFolders.has(parentFolderPath)
                            });
                        }
                    }
                }
            }
        });
        
        const result = Array.from(folderSet.values());
        return result;
    }, [folders, localDocuments, expandedFolders, normalizePath, getFolderPath]);

    const handleDropRoot = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const draggedFileId = e.dataTransfer.getData('text/plain');
    
    
    onMove(draggedFileId, '');
    
    setDragOverRoot(false);
    setDraggedItemId(null);
}, [onMove]);

    const fileItems: FileItem[] = useMemo(() => {
        const result = localDocuments.map(doc => {
            const normalizedPath = normalizePath(doc.path);
            const fullPath = normalizedPath ? 
                `${normalizedPath}/${doc.name}` : 
                doc.name;
            
            return {
                id: doc.id,
                name: doc.name,
                type: 'file' as const,
                path: fullPath,
                modified: doc.modified
            };
        });
        return result;
    }, [localDocuments, normalizePath]);

    const treeItems = useMemo(() => {

    
    const itemsByPath = new Map<string, TreeItem>();
    
    allFolders.forEach(folder => {
        itemsByPath.set(folder.path, { ...folder, children: [] });
    });
    
    fileItems.forEach(file => {
        itemsByPath.set(file.path, file);
    });
    
    const itemsByParentPath = new Map<string, TreeItem[]>();
    
    Array.from(itemsByPath.values()).forEach(item => {
        let parentPath = '';
        
        if (item.type === 'file') {
            const normalizedPath = normalizePath(item.path);
            const lastSlashIndex = normalizedPath.lastIndexOf('/');
            parentPath = lastSlashIndex === -1 ? '' : normalizedPath.substring(0, lastSlashIndex + 1);
        } else {
            const normalizedParent = normalizePath(item.path);
            const parts = normalizedParent.split('/').filter(Boolean);
            if (parts.length > 1) {
                parts.pop();
                parentPath = parts.join('/') + '/';
            } else {
                parentPath = '';
            }
        }
        
        
        if (!itemsByParentPath.has(parentPath)) {
            itemsByParentPath.set(parentPath, []);
        }
        itemsByParentPath.get(parentPath)!.push(item);
    });
    
    const buildTree = (parentPath: string): TreeItem[] => {
        const items = itemsByParentPath.get(parentPath) || [];
        const sortedItems = items.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        
        return sortedItems.map(item => {
            if (item.type === 'folder') {
                return {
                    ...item,
                    children: buildTree(item.path)
                };
            }
            return item;
        });
    };
    
    const result = buildTree('');
    return result;
}, [allFolders, fileItems, normalizePath]);



    const handleStartRename = useCallback((id: string, currentName: string) => {
        setMenuId(null);
        setEditingId(id);
        setEditName(currentName);
    }, []);

    const handleSaveRename = useCallback((id: string, newName: string) => {
        
        if (newName.trim()) {
            const folder = allFolders.find(f => f.id === id);
            
            if (folder) {
                const oldPath = folder.path;
                let parentPath = '';
                const parts = oldPath.split('/').filter(Boolean);
                
                if (parts.length > 1) {
                    parts.pop();
                    parentPath = parts.join('/') + '/';
                }
                
                const newPath = parentPath + newName.trim() + '/';
                
                const isUserFolder = folders.some(f => f.id === id);
                
                if (isUserFolder) {
                    setFolders(prev => prev.map(f => 
                        f.id === id 
                            ? { ...f, name: newName.trim(), path: newPath }
                            : f
                    ));
                } else {
                    const newFolder: Folder = {
                        id: `folder-${Date.now()}`,
                        name: newName.trim(),
                        type: 'folder',
                        path: newPath,
                        isExpanded: folder.isExpanded
                    };
                    setFolders(prev => [...prev, newFolder]);
                }
                
                if (expandedFolders.has(oldPath)) {
                    setExpandedFolders(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(oldPath);
                        newSet.add(newPath);
                        return newSet;
                    });
                }
                
                // Обновляем пути вложенных папок
                const childFolders = allFolders.filter(f => 
                    f.id !== id && f.path.startsWith(oldPath)
                );
                
                if (childFolders.length > 0) {
                    setFolders(prev => prev.map(f => {
                        if (f.path.startsWith(oldPath) && f.id !== id) {
                            const newChildPath = f.path.replace(oldPath, newPath);
                            return { ...f, path: newChildPath };
                        }
                        return f;
                    }));
                }
                
                // Обновляем пути вложенных файлов
                const childFiles = fileItems.filter(file => 
                    file.path.startsWith(oldPath)
                );
                
                changeAllDocPath(oldPath, newPath);
                
                childFiles.forEach(file => {
                    const newFilePath = file.path.replace(oldPath, newPath);
                    const doc = localDocuments.find(d => d.id === file.id);
                    if (doc) {
                        doc.path = newPath;  // Мутация для простоты, или создайте новый объект
                        doc.modified = true;
                    }
                    onFolderRename(file.id, file.path, newFilePath);
                });
                setLocalDocuments([...localDocuments]);
                
            } else {
                // Это файл
                setLocalDocuments(prev => prev.map(doc => 
                    doc.id === id 
                        ? { ...doc, name: newName.trim(), modified: true }
                        : doc
                ));
                onRename(id, newName.trim());
            }
        }
        
        setEditingId(null);
        setEditName("");
    }, [allFolders, folders, expandedFolders, fileItems, changeAllDocPath, onFolderRename, onRename]);

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
            return newSet;
        });
    }, []);

    const handleDeleteItem = useCallback((id: string) => {
        const isFolder = allFolders.some(f => f.id === id);
        if (isFolder) {
            const folder = allFolders.find(f => f.id === id);
            if (folder) {
                setFolders(prev => prev.filter(f => f.id !== id));
                setExpandedFolders(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(folder.path);
                    return newSet;
                });
            }
        } else {
            // Удаляем из локального состояния
            setLocalDocuments(prev => prev.filter(doc => doc.id !== id));
            onDelete(id);
        }
        setMenuId(null);
    }, [allFolders, onDelete]);

    const handleAddItem = (itemName: string, itemType: 'file' | 'folder') => {
        if (itemType === 'file') {
            const folderPath = normalizePath(currentPathForCreate);
            onAdd(itemName, folderPath);
        } else {
            const normalizedCurrentPath = normalizePath(currentPathForCreate);
            const folderPath = normalizedCurrentPath ? 
                `${normalizedCurrentPath}/${itemName}/` : 
                `${itemName}/`;
            
            const newFolder: Folder = {
                id: `folder-${Date.now()}`,
                name: itemName,
                type: 'folder',
                path: folderPath,
                isExpanded: false
            };
            
            setFolders(prev => [...prev, newFolder]);
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
    const targetFolder = allFolders.find(f => f.id === folderId);
    
    if (!draggedFileId || !targetFolder) return;
        
    // ✅ Локальное обновление + родитель
    onMove(draggedFileId, targetFolder.path);  // Только это!
    
    setDragOverItemId(null);
    setDraggedItemId(null);
}, [allFolders, onMove]);

    const handleDragEnd = useCallback(() => {
        setDraggedItemId(null);
        setDragOverItemId(null);
        setDragOverRoot(false);
        
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

    // Добавим отладку для рендера


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
                <div 
        className={`${cls.rootDropZone} ${dragOverRoot ? cls.dragOver : ''}`}
        onDragOver={(e) => {
            e.preventDefault();
            setDragOverRoot(true);
            e.dataTransfer.dropEffect = 'move';
        }}
        onDragLeave={() => setDragOverRoot(false)}
        onDrop={handleDropRoot}
        style={{ minHeight: '20px', width: "auto" }}
    />
            </ul>
        </div>
    );
};