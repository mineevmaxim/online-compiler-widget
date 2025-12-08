import { useState } from "react";
import type { EditorDocument } from "../types/EditorDocument";
import { v4 as uuidv4 } from 'uuid';

export function useCompiler(initialFiles?: Record<string, string>) {
    const [documents, setDocuments] = useState<EditorDocument[]>(() => {
        if (!initialFiles) return [];

        return Object.entries(initialFiles).map(([path, content]) => ({
            id: uuidv4(),
            path,
            name: path.split("/").pop() || path,
            language: path.endsWith(".cs") ? "csharp" : "javascript",
            content,
            modified: false,
        }));
    });

    const [selectedId, setSelectedId] = useState<string | null>(
        () => documents[0]?.id || null
    );

    const selectedDocument = documents.find(d => d.id === selectedId) || null;

    const setDocumentContent = (id: string, newContent: string) => {
        setDocuments(docs =>
            docs.map(d =>
                d.id === id
                    ? { ...d, content: newContent, modified: true }
                    : d
            )
        );
    };

    const addDocument = () => {
        const newDoc: EditorDocument = {
            id: uuidv4(),
            path: `file${documents.length + 1}.js`,
            name: `file${documents.length + 1}.js`,
            language: "javascript",
            content: "// New file",
            modified: false,
        };

        setDocuments(d => [...d, newDoc]);
        setSelectedId(newDoc.id);
    };


    const updateDocument = (id: string, patch: Partial<EditorDocument>) => {
        setDocuments(docs =>
            docs.map(doc => doc.id === id ? { ...doc, ...patch, modified: true } : doc)
        );
    };


    const deleteDocument = (id: string) => {
        setDocuments(docs => docs.filter(doc => doc.id !== id));
    };

    return {
        documents,
        selectedDocument,
        selectedId,
        setSelectedId,
        setDocumentContent,
        addDocument,
        updateDocument,
        deleteDocument,
        output: "",
        history: [],
    };
}

