import React, { useState, useRef, useEffect } from "react";
import cls from "./FileExplorer.module.scss";
import DocumentIcon from "../assets/documentIcon.svg?react";
import PlusIcon from "../assets/plus.svg?react";
import type { EditorDocument } from "../types/EditorDocument";

interface FileExplorerProps {
    documents: EditorDocument[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;

    // новые callbacks
    onRename: (id: string) => void;
    onDelete: (id: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
                                                              documents,
                                                              selectedId,
                                                              onSelect,
                                                              onAdd,
                                                              onRename,
                                                              onDelete
                                                          }) => {
    const [menuId, setMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // закрытие меню при клике вне
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuId(null);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className={cls.fileExplorer}>
            <div className={cls.header}>
                <DocumentIcon className={cls.documentIcon} />
                <span>Файлы</span>
                <button onClick={onAdd} className={cls.addButton}>
                    <PlusIcon className={cls.plusIcon} />
                </button>
            </div>

            <ul className={cls.fileList}>
                {documents.map(doc => (
                    <li
                        key={doc.id}
                        className={`${cls.fileItem} ${
                            selectedId === doc.id ? cls.selected : ""
                        }`}
                    >
                        <div
                            className={cls.clickZone}
                            onClick={() => onSelect(doc.id)}
                        >
                            <span className={cls.fileIcon}>📄</span>
                            <span className={cls.itemText}>{doc.name}</span>
                        </div>

                        {/* кнопка меню */}
                        <button
                            className={cls.moreBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuId(menuId === doc.id ? null : doc.id);
                            }}
                        >
                            ⋮
                        </button>

                        {/* Само меню */}
                        {menuId === doc.id && (
                            <div className={cls.contextMenu} ref={menuRef}>
                                <div
                                    className={cls.menuItem}
                                    onClick={() => {
                                        setMenuId(null);
                                        onRename(doc.id);
                                    }}
                                >
                                    Переименовать
                                </div>
                                <div
                                    className={cls.menuItem}
                                    onClick={() => {
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
