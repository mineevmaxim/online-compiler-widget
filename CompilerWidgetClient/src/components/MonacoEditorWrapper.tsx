// src/components/MonacoEditorWrapper.tsx
import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import cls from "./MonacoEditorWrapper.module.scss";
import StartIcon from "../assets/start.svg?react";
import StopIcon from "../assets/stop.svg?react";

interface MonacoEditorWrapperProps {
    code: string;
    language: string; // "javascript" | "csharp"
    onChange: (value: string) => void;
    theme?: string;
    filename?: string;
}

export const MonacoEditorWrapper: React.FC<MonacoEditorWrapperProps> = ({
                                                                            code,
                                                                            language,
                                                                            onChange,
                                                                            theme = "vs-light",
                                                                            filename
                                                                        }) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const modelRef = useRef<monaco.editor.ITextModel | null>(null);

    // Создаём модель при загрузке редактора
    const handleEditorDidMount = (
        editor: monaco.editor.IStandaloneCodeEditor
    ) => {
        editorRef.current = editor;
    };

    // 🔥 Создание / обновление модели при переключении документа
    useEffect(() => {
        if (!editorRef.current) return;

        // удаляем старую модель
        if (modelRef.current) {
            modelRef.current?.dispose();
        }

        const newModel = monaco.editor.createModel(code, "csharp");
        modelRef.current = newModel;


        editorRef.current?.focus();
    }, [code, "csharp"]);

    return (
        <div className={cls.editorContainer}>
            <div className={cls.editorHeader}>
                <span>{filename}</span>
            </div>

            <Editor
                height="100%"
                language={"csharp"}
                theme={theme}
                onMount={handleEditorDidMount}
                value={code} // контролируемое значение
                onChange={(v) => onChange(v || "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    wordWrap: "off",
                    lineNumbers: "on",
                    folding: true,
                    renderLineHighlight: "all",
                    tabSize: 4,
                    // ✅ C# улучшения
                    automaticLayout: true,
                    cursorBlinking: "smooth",
                    fontLigatures: true,
                    suggest: {
                        showFunctions: true,
                        showClasses: true,
                        showVariables: true,
                        showConstructors: true,
                    },
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false,
                    },
                    parameterHints: {
                        enabled: true,
                    },
                    lightbulb: {
                        enabled: "onCode" as any,
                    },
                            }}
            />
        </div>
    );
};
