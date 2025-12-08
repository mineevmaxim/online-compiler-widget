import { useEffect, useLayoutEffect, useState } from "react";
import type { EditorDocument } from "../types/EditorDocument";
import { FileApi, ProjectApi, CompilerApi } from "../api";

export function useCompiler(initialFiles?: Record<string, string>) {

    const [projectId, setProjectId] = useState<string>("");
    const [output, setOutput] = useState<string>("");

    const fileApi = new FileApi();
    const projectApi = new ProjectApi();
    const compilerApi = new CompilerApi();

    useLayoutEffect(() => {
        projectApi.apiProjectsCreatePost({ name: "AHAHHAHAHA" })
            .then(res => {
                setProjectId(res.data.projectId);
            })
            .catch(err => alert(err))
    }, []);


    const [documents, setDocuments] = useState<EditorDocument[]>([]);

    useEffect(() => {
        if (projectId && initialFiles) {
            setDocuments([]);
            Object.keys(initialFiles).forEach(key => {
                console.log(key, initialFiles[key]);

                fileApi.apiFilesProjectProjectIdPost(projectId, {
                    name: key,
                    path: key
                }).then(res => {
                    const file: EditorDocument = {
                        id: res.data,
                        content: initialFiles[key],
                        language: "csharp",
                        modified: false,
                        name: key,
                        path: key
                    };
                    setDocuments(docs => [...docs, file]);
                    fileApi.apiFilesFileIdSavePost(file.id, {
                        content: initialFiles[key],
                    })
                        .then(res => console.log(res))
                })
            });
        }
    }, [projectId]);

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
        let fileId = "";

        fileApi.apiFilesProjectProjectIdPost(projectId, {
            name: `file${documents.length + 1}.cs`,
            path: `file${documents.length + 1}.cs`
        })
            .then(res => {
                fileId = res.data;
                const newDoc: EditorDocument = {
                    id: fileId,
                    path: `file${documents.length + 1}.cs`,
                    name: `file${documents.length + 1}.cs`,
                    language: "csharp",
                    content: "// New file",
                    modified: false,
                };

                setDocuments(d => [...d, newDoc]);
                setSelectedId(newDoc.id);
            })
            .catch(err => alert(err));
    };


    const updateDocument = (id: string, patch: Partial<EditorDocument>) => {
        setDocuments(docs =>
            docs.map(doc => doc.id === id ? { ...doc, ...patch, modified: true } : doc)
        );
    };


    const deleteDocument = (id: string) => {
        fileApi.apiFilesFileIdDeletePost(id)
            .then(() => setDocuments(docs => docs.filter(doc => doc.id !== id)))
            .catch(err => alert(err));
    };

    const run = () => {
        compilerApi.apiCompileProjectProjectIdRunPost(projectId, { mainFile: "ConsoleApp.csproj" })
            .then(res => {
                console.log(res)
                setOutput(res.data.output ?? "")
            })
            .catch(err => alert(err));
    }
    const stop = () => {
        compilerApi.apiCompileProjectProjectIdStopPost(projectId)
            .then(res => console.log(res.data))
            .catch(err => alert(err));
    }

    return {
        documents,
        selectedDocument,
        selectedId,
        setSelectedId,
        setDocumentContent,
        addDocument,
        updateDocument,
        deleteDocument,
        run,
        stop,
        output,
        history: [],
    };
}

