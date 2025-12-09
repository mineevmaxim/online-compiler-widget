import React, { useState, useRef, useEffect, useCallback } from "react";
import cls from "./FileExplorer.module.scss";
import DocumentIcon from "../assets/documentIcon.svg?react";
import PlusIcon from "../assets/plus.svg?react";
import type { EditorDocument } from "../types/EditorDocument";

interface FileExplorerProps {
    documents: EditorDocument[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: (fileName?: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
}

// Компонент модального окна для создания файла
interface AddFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (fileName: string) => void;
}

const AddFileModal: React.FC<AddFileModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");
    
    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const trimmedName = fileName.trim();
        
        if (!trimmedName) {
            setError("Введите имя файла");
            return;
        }
        
        // Проверяем расширение
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
        
        onConfirm(trimmedName);
        setFileName("");
        setError("");
    };
    
    const handleClose = () => {
        setFileName("");
        setError("");
        onClose();
    };
    
    return (
        <div className={cls.modalOverlay} onClick={handleClose}>
            <div className={cls.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>Создать новый файл</h3>
                <form onSubmit={handleSubmit}>
                    <div className={cls.formGroup}>
                        <label htmlFor="fileName">Имя файла с расширением:</label>
                        <input
                            id="fileName"
                            type="text"
                            value={fileName}
                            onChange={(e) => {
                                setFileName(e.target.value);
                                setError("");
                            }}
                            placeholder="Например: program.cs или script.js"
                            autoFocus
                            className={error ? cls.error : ""}
                        />
                        <div className={cls.helpText}>
                            Введите имя файла с расширением (.cs, .js, .txt)
                        </div>
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
                            disabled={!fileName.trim()}
                        >
                            Создать
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
    documents,
    selectedId,
    onSelect,
    onAdd,
    onRename,
    onDelete
}) => {
    const [menuId, setMenuId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    
    const menuRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Закрытие меню при клике вне
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuId(null);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Фокус на input при начале редактирования
    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleStartRename = useCallback((id: string, currentName: string) => {
        setMenuId(null);
        setEditingId(id);
        setEditName(currentName);
    }, []);

    const handleSaveRename = useCallback((id: string) => {
        if (editName.trim() && editName.trim() !== documents.find(d => d.id === id)?.name) {
            onRename(id, editName.trim());
        }
        setEditingId(null);
        setEditName("");
    }, [editName, onRename, documents]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveRename(id);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setEditingId(null);
            setEditName("");
        }
    }, [handleSaveRename]);

    const handleBlur = useCallback((id: string) => {
        setTimeout(() => {
            handleSaveRename(id);
        }, 100);
    }, [handleSaveRename]);

    const handleAddFile = (fileName: string) => {
        onAdd(fileName);
        setShowAddModal(false);
    };

    return (
        <div className={cls.fileExplorer}>
            <AddFileModal 
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onConfirm={handleAddFile}
            />
            
            <div className={cls.header}>
                <DocumentIcon className={cls.documentIcon} />
                <span>Файлы</span>
                <button 
                    onClick={() => setShowAddModal(true)} 
                    className={cls.addButton}
                    title="Добавить файл"
                >
                    <PlusIcon className={cls.plusIcon} />
                </button>
            </div>

            <ul className={cls.fileList}>
                {documents.map(doc => (
                    <li
                        key={doc.id}
                        className={`${cls.fileItem} ${
                            selectedId === doc.id ? cls.selected : ""
                        } ${doc.modified ? cls.modified : ""}`}
                        onClick={() => !editingId && onSelect(doc.id)}
                    >
                        <div className={cls.clickZone}>
                            <span className={cls.fileIcon}>📄</span>
                            
                            {editingId === doc.id ? (
                                <div className={cls.editContainer}>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className={cls.editInput}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, doc.id)}
                                        onBlur={() => handleBlur(doc.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                            ) : (
                                <div className={cls.nameContainer}>
                                    <span className={cls.itemText}>{doc.name}</span>
                                    {doc.modified && (
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

                        {editingId !== doc.id && (
                            <button
                                className={cls.moreBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuId(menuId === doc.id ? null : doc.id);
                                }}
                                title="Действия с файлом"
                            >
                                ⋮
                            </button>
                        )}

                        {menuId === doc.id && (
                            <div className={cls.contextMenu} ref={menuRef}>
                                <div
                                    className={cls.menuItem}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartRename(doc.id, doc.name);
                                    }}
                                >
                                    Переименовать
                                </div>
                                <div
                                    className={cls.menuItem}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuId(null);
                                        onDelete(doc.id);
                                    }}
                                >
                                    Удалить
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};