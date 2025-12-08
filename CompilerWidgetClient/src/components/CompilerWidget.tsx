// src/components/CompilerWidget.tsx
import React, { memo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
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
    id: string;
    data?: {
        initialFiles?: Record<string, string>;
        language?: 'csharp' | 'js';
    };
    setNodeHeight?: (id: string, height: number) => void;
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
        run,
        stop
    } = useCompiler(
        data?.initialFiles || {
            'Program.cs': '// Write your code here\nConsole.WriteLine("Hello, World!");',
        }
    );

    // useReactFlow мы оставляем, но НЕ полагаемся на updateNodeDimensions — вызываем опционально
    const rf = useReactFlow();
    const maybeUpdateNodeDimensions = (nodeId: string) => {
        if (rf && typeof (rf as any).updateNodeDimensions === 'function') {
            try {
                (rf as any).updateNodeDimensions(nodeId);
            } catch {
                // игнорируем ошибки — основной механизм через setNodeHeight
            }
        }
    };

    const currentDocument: EditorDocument | null = selectedDocument ?? (documents[0] ?? null);
    const currentCode = currentDocument?.content ?? '';
    const currentLanguage =
        currentDocument?.language ??
        (data?.language === 'js' ? 'javascript' : 'csharp');

    // panel widths
    const [leftWidth, setLeftWidth] = useState(180);
    const [rightWidth, setRightWidth] = useState(220);

    const [collapsed, setCollapsed] = useState(false);

    const handleCodeChange = (newCode: string) => {
        if (currentDocument) {
            setDocumentContent(currentDocument.id, newCode);
        }
    };

    // Обработчик переименования файла
   const handleRename = (id: string, newName: string) => {
        const doc = documents.find(d => d.id === id);
        if (!doc || newName === doc.name) return;
        
        updateDocument(id, {
            name: newName
        });
    };

    const containerRef = useRef<HTMLDivElement | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Синхронизировать высоту ноды при изменении контейнера
    useLayoutEffect(() => {
        if (!containerRef.current || !setNodeHeight) return;

        // initial set
        const rect = containerRef.current.getBoundingClientRect();
        const initialHeight = collapsed ? 42 : Math.round(rect.height);
        setNodeHeight(id, initialHeight);
        maybeUpdateNodeDimensions(id);

        // Создаём ResizeObserver, если доступен
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === containerRef.current) {
                    const h = collapsed ? 42 : Math.round(entry.contentRect.height);
                    setNodeHeight(id, h);
                    // опционально форсируем перерисовку XYFlow (если API доступен)
                    maybeUpdateNodeDimensions(id);
                }
            }
        });

        resizeObserverRef.current = ro;
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            resizeObserverRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, setNodeHeight, collapsed]);

    useEffect(() => {
        // при смене collapsed форсируем одноразовый пересчёт (на случай, если ResizeObserver не сработал моментально)
        if (!containerRef.current || !setNodeHeight) return;
        const h = collapsed ? 42 : Math.round(containerRef.current.getBoundingClientRect().height);
        setNodeHeight(id, h);
        maybeUpdateNodeDimensions(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapsed]);

    const toggleCollapsed = () => setCollapsed(prev => !prev);

    // Manual panel resizing: убираем прямые вызовы updateNodeDimensions, теперь ResizeObserver всё подхватит
    const startResizing = (
        e: React.MouseEvent,
        setter: (v: number) => void,
        startWidth: number,
        direction: "left" | "right",
        min = 120,
        max = 1000
    ) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const newWidth = direction === "left" ? startWidth + dx : startWidth - dx;
            setter(Math.min(Math.max(newWidth, min), max));
            // НЕ вызываем updateNodeDimensions здесь — ResizeObserver увидит изменение размеров DOM и обновит ноду
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    return (
        <div
            ref={containerRef}
            className={`${cls.widget} ${collapsed ? cls.collapsed : ''}`}
        >
            <Handle type="target" position={Position.Top} />

            {/* GLOBAL NodeResizer (xyflow) — виден только если не collapsed */}
            {!collapsed && (
                <NodeResizer
                    minWidth={600}
                    minHeight={300}
                    // Некоторые версии NodeResizer поддержуют onResize/onResizeEnd, некоторые — нет.
                    // Мы полагаемся на ResizeObserver для синхронизации высоты, так что не обязаны использовать коллбэки.
                />
            )}

            {/* HEADER */}
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
                                <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        ) : (
                            <CloseIcon className={cls.close} />
                        )}
                    </button>
                </div>
            </div>

            {/* BODY */}
            {!collapsed && (
                <div className={cls.body}>
                    {/* LEFT PANEL */}
                    <div className={cls.panel} style={{ width: leftWidth }}>
                        <FileExplorer
                            documents={documents}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onAdd={addDocument}
                            onRename={handleRename} // Используем inline-редактирование
                            onDelete={deleteDocument}
                        />

                        <div
                            className={cls.resizer}
                            onMouseDown={(e) =>
                                startResizing(e, setLeftWidth, leftWidth, "left")
                            }
                        />
                    </div>

                    {/* CENTER */}
                    <div className={cls.centerPanel}>
                        {currentDocument ? (
                            <div className={cls.editCont}>
                                <MonacoEditorWrapper
                                    code={currentCode}
                                    language={currentLanguage}
                                    onChange={handleCodeChange}
                                    theme="vs-light"
                                />
                                <RunContainer run={run} stop={stop}/>
                            </div>
                        ) : (
                            <div style={{ padding: 16, color: '#666' }}>
                                Нет открытого документа
                            </div>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className={cls.panel} style={{ width: rightWidth }}>
                        <OutputPanel output={output} history={history} />

                        <div
                            className={cls.resizer}
                            onMouseDown={(e) =>
                                startResizing(e, setRightWidth, rightWidth, "right")
                            }
                        />
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default memo(CompilerWidget);