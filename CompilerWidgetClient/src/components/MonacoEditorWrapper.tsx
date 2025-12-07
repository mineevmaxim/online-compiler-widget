// src/components/MonacoEditorWrapper.tsx
import React, { useRef, useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import cls from "./MonacoEditorWrapper.module.scss";
import StartIcon from "../assets/start.svg?react";
import StopIcon from "../assets/stop.svg?react";

interface MonacoEditorWrapperProps {
    code: string;
    language: string; // "javascript" | "csharp"
    onChange: (value: string) => void;
    theme?: string;
}

export const MonacoEditorWrapper: React.FC<MonacoEditorWrapperProps> = ({
                                                                            code,
                                                                            language,
                                                                            onChange,
                                                                            theme = "vs-light",
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

        const newModel = monaco.editor.createModel(code, language);
        modelRef.current = newModel;


        editorRef.current?.focus();
    }, [code, language]);

    return (
        <div className={cls.editorContainer}>
            <div className={cls.editorHeader}>
                <span>{language === "csharp" ? "C#" : "JS"}</span>
            </div>

            <Editor
                height="100%"
                language={language}
                theme={theme}
                onMount={handleEditorDidMount}
                value={code} // контролируемое значение
                onChange={(v) => onChange(v || "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    lineNumbers: "on",
                    folding: true,
                    renderLineHighlight: "all",
                    tabSize: 2,
                }}
            />
            <div className={cls.runContainer}>
                <button className={cls.runButton}>
                    <StartIcon className={cls.startIcon}/>
                    <p className={cls.runText}>Run</p>
                </button>
                <button className={cls.stopButton}>
                    <StopIcon className={cls.stopIcon}/>
                    <p className={cls.runText}>Stop</p>
                </button>
            </div>
        </div>
    );
};
