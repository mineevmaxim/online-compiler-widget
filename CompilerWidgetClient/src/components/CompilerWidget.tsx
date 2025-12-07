// src/components/CompilerWidget.tsx
import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileExplorer } from './FileExplorer';
import { MonacoEditorWrapper } from './MonacoEditorWrapper';
import { OutputPanel } from './OutputPanel';
import cls from './CompilerWidget.module.scss';
import { useCompiler } from '../hooks/useCompiler';

import ShieldIcon from "../assets/shield.svg?react";
import BadgeIcon from "../assets/Badge.svg?react";
import CloseIcon from "../assets/closeIcon.svg?react";

import type { EditorDocument } from '../types/EditorDocument';

interface CompilerWidgetProps {
    data?: {
        initialFiles?: Record<string, string>;
        // legacy language hint (optional)
        language?: 'csharp' | 'js';
    };
}

const CompilerWidget: React.FC<CompilerWidgetProps> = ({ data }) => {
    // useCompiler принимает Record<string,string> as initialFiles — OK
    const {
        documents,
        selectedDocument,
        selectedId,
        setSelectedId,
        setDocumentContent,
        addDocument,
        deleteDocument,
        updateDocument,
        output,
        history,
    } = useCompiler(
        data?.initialFiles || {
            'Program.cs': '// Write your code here\nConsole.WriteLine("Hello, World!");',
        }
    );

    const handleRename = (id: string) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;

        const newName = prompt("Новое имя файла:", doc.name);
        if (!newName) return;

        updateDocument(id, {
            name: newName,
            path: doc.path.replace(doc.name, newName)
        });
    };




    // derive values for editor
    const currentDocument: EditorDocument | null = selectedDocument ?? (documents[0] ?? null);
    const currentCode = currentDocument?.content ?? '';
    const currentLanguage =
        currentDocument?.language ??
        (data?.language === 'js' ? 'javascript' : 'csharp');

    // reasonable default sizes
    const [leftWidth, setLeftWidth] = useState<number>(180);
    const [rightWidth, setRightWidth] = useState<number>(220);

    const [collapsed, setCollapsed] = useState(false);

    const handleCodeChange = (newCode: string) => {
        if (!currentDocument) return;
        setDocumentContent(currentDocument.id, newCode);
    };

    // generic horizontal resizing
    const startResizing = (
        e: React.MouseEvent,
        setWidth: (w: number) => void,
        currentWidth: number,
        min = 120,
        max = 600,
        direction: 'left' | 'right' = 'left'
    ) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;

        const doDrag = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            const newWidth = direction === 'left' ? currentWidth + delta : currentWidth - delta;
            setWidth(Math.min(Math.max(newWidth, min), max));
        };

        const stopDrag = () => {
            window.removeEventListener('mousemove', doDrag);
            window.removeEventListener('mouseup', stopDrag);
        };

        window.addEventListener('mousemove', doDrag);
        window.addEventListener('mouseup', stopDrag);
    };

    return (
        <div className={`${cls.widget} ${collapsed ? cls.collapsed : ''}`}>
            <Handle type="target" position={Position.Top} />

            {/* Drag only via header area — XYFlow will use the DOM element with this wrapper as drag handle */}
            <div className="drag-handle__custom">
                <div className={cls.header}>
                    <h4>Code Block</h4>

                    <div className={cls.shieldContainer}>
                        <ShieldIcon className={cls.shield} />
                        <BadgeIcon className={cls.badge} />
                    </div>

                    <button className={cls.closeButton} onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? (
                            // иконка «развернуть»
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        ) : (
                            <CloseIcon className={cls.close} />
                        )}
                    </button>
                </div>
            </div>
            {!collapsed && (
            <div className={cls.body}>
                {/* LEFT: File Explorer */}
                <div className={cls.panel} style={{ width: leftWidth }}>
                    <FileExplorer
                        documents={documents}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onAdd={addDocument}
                        onRename={handleRename}
                        onDelete={deleteDocument}
                    />

                    <div
                        className={cls.resizer}
                        onMouseDown={(e) =>
                            startResizing(e, setLeftWidth, leftWidth, 120, 420, 'left')
                        }
                    />
                </div>

                {/* CENTER: Monaco editor (flexible) */}
                <div className={cls.centerPanel}>
                    {currentDocument ? (
                        <MonacoEditorWrapper
                            code={currentCode}
                            language={currentLanguage}
                            onChange={handleCodeChange}
                            theme="vs-light"
                        />
                    ) : (
                        <div style={{ padding: 16, color: '#666' }}>
                            Нет открытого документа
                        </div>
                    )}
                </div>

                {/* RIGHT: Output */}
                <div className={cls.panel} style={{ width: rightWidth }}>
                    <OutputPanel output={output} history={history} />

                    <div
                        className={cls.resizer}
                        onMouseDown={(e) =>
                            startResizing(e, setRightWidth, rightWidth, 140, 450, 'right')
                        }
                        // for right panel resizer we position it from left in CSS (.panel:last-child .resizer)
                    />
                </div>
            </div>)}

            <Handle type="source" position={Position.Bottom} />
        </div>

    );
};

export default memo(CompilerWidget);
