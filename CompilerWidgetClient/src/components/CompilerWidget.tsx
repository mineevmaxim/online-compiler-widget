import React, { memo, useState, useEffect } from 'react';
import { Handle, NodeResizer, Position } from '@xyflow/react';
import { FileExplorer } from './FileExplorer';
import { MonacoEditorWrapper } from './MonacoEditorWrapper';
import { OutputPanel } from './OutputPanel';
import cls from './CompilerWidget.module.scss';
import { useCompiler } from '../hooks/useCompiler';

import ShieldIcon from "../assets/shield.svg?react";
import BadgeIcon from "../assets/Badge.svg?react";
import CloseIcon from "../assets/closeIcon.svg?react";

import type { EditorDocument } from '../types/EditorDocument';
import { RunContainer } from "./RunContainer.tsx";

interface CompilerWidgetProps {
    id: string; // id узла
    data?: {
        initialFiles?: Record<string, string>;
        language?: 'csharp' | 'js';
    };
    setNodeHeight?: (id: string, height: number) => void; // функция из App
}

const CompilerWidget: React.FC<CompilerWidgetProps> = ({ id, data, setNodeHeight }) => {
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

    const currentDocument: EditorDocument | null = selectedDocument ?? (documents[0] ?? null);
    const currentCode = currentDocument?.content ?? '';
    const currentLanguage =
        currentDocument?.language ??
        (data?.language === 'js' ? 'javascript' : 'csharp');

    const [leftWidth, setLeftWidth] = useState<number>(180);
    const [rightWidth, setRightWidth] = useState<number>(220);
    const [collapsed, setCollapsed] = useState(false);

    const handleCodeChange = (newCode: string) => {
        if (!currentDocument) return;
        setDocumentContent(currentDocument.id, newCode);
    };

    // пересчитываем высоту узла после изменения collapsed
    useEffect(() => {
        if (setNodeHeight) {
            setNodeHeight(id, collapsed ? 42 : 400);
        }
    }, [collapsed, id, setNodeHeight]);

    const toggleCollapsed = () => {
        setCollapsed(prev => !prev);
    };

    return (
        <div className={`${cls.widget} ${collapsed ? cls.collapsed : ''}`}>
            <NodeResizer
                minWidth={600}
                minHeight={collapsed ? 42 : 450}
                maxHeight={collapsed ? 43 : undefined}
            />
            <Handle type="target" position={Position.Top} />

            <div className="drag-handle__custom">
                <div className={cls.header}>
                    <h4>Code Block</h4>
                    <div className={cls.shieldContainer}>
                        <ShieldIcon className={cls.shield} />
                        <BadgeIcon className={cls.badge} />
                    </div>
                    <button className={cls.closeButton} onClick={toggleCollapsed}>
                        {collapsed ? (
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
                    <div className={cls.panel} style={{ width: leftWidth }}>
                        <FileExplorer
                            documents={documents}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onAdd={addDocument}
                            onRename={(id) => {
                                const doc = documents.find(d => d.id === id);
                                if (!doc) return;
                                const newName = prompt("Новое имя файла:", doc.name);
                                if (!newName) return;
                                updateDocument(id, {
                                    name: newName,
                                    path: doc.path.replace(doc.name, newName)
                                });
                            }}
                            onDelete={deleteDocument}
                        />
                    </div>

                    <div className={cls.centerPanel}>
                        {currentDocument ? (
                            <div className={cls.editCont}>
                                <MonacoEditorWrapper
                                    code={currentCode}
                                    language={currentLanguage}
                                    onChange={handleCodeChange}
                                    theme="vs-light"
                                />
                                <RunContainer />
                            </div>
                        ) : (
                            <div style={{ padding: 16, color: '#666' }}>
                                Нет открытого документа
                            </div>
                        )}
                    </div>

                    <div className={cls.panel} style={{ width: rightWidth }}>
                        <OutputPanel output={output} history={history} />
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default memo(CompilerWidget);
