import {useEffect, useLayoutEffect, useState } from "react";
import type { EditorDocument } from "../types/EditorDocument";
import { FileApi, ProjectApi, CompilerApi } from "../api";

export function useCompiler(id: string, isNew: boolean, initialFiles?: Record<string, string>) {

    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [needToCreateFiles, setNeedToCreateFiles] = useState<boolean>(isNew);

    const [projectId, setProjectId] = useState<string>(id);
    const [output, setOutput] = useState<string>("");

    const fileApi = new FileApi();
    const compilerApi = new CompilerApi();


    const [documents, setDocuments] = useState<EditorDocument[]>([]);

    useEffect(() => {
        if (projectId && initialFiles && !isInitialized && needToCreateFiles) {
            setDocuments([]);
            Object.keys(initialFiles).forEach(key => {
                

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
                        
                })
                    .finally(() => setIsInitialized(true));
            });
        }
    }, [projectId, initialFiles, needToCreateFiles]);

    useEffect(() => {
        if (projectId && !isInitialized && !needToCreateFiles) {
            setDocuments([]);
            fileApi.apiFilesProjectIdGet(projectId)
                .then((files) => {
                    files.data.forEach(file => {
                        

                        fileApi.apiFilesReadFileIdGet(file.fileId!).then(res => {
                            const document: EditorDocument = {
                                id: file.fileId!,
                                content: res.data,
                                language: "csharp",
                                modified: false,
                                name: file.fileName!,
                                path: file.path!
                            };
                            setDocuments(docs => [...docs, document]);
                        })
                            .finally(() => setIsInitialized(true));
                    });
                })

        }
    }, [projectId, initialFiles, needToCreateFiles]);

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

    // В useCompiler.ts обновляем функцию addDocument:
    const addDocument = (fileName?: string, path?: string) => {
        // Если передано имя файла - используем его, иначе генерируем
        const defaultName = `file${documents.length + 1}.cs`;
        const finalName = fileName || defaultName;

        let fileId = "";

        fileApi.apiFilesProjectProjectIdPost(projectId, {
            name: finalName,
            path: path
        })
            .then(res => {
                fileId = res.data;

                // Определяем язык по расширению
                let language: "javascript" | "csharp" = "csharp";
                if (finalName.endsWith('.js')) {
                    language = "javascript";
                }

                // Начальное содержимое в зависимости от языка
                let initialContent = "// New file";
                if (language === "javascript") {
                    initialContent = "// JavaScript file";
                }

                const finalPath = path? path : "";

                const newDoc: EditorDocument = {
                    id: fileId,
                    path: finalPath,
                    name: finalName,
                    language: language,
                    content: initialContent,
                    modified: false,
                };

                setDocuments(d => [...d, newDoc]);
                setSelectedId(newDoc.id);

                // Сохраняем начальное содержимое
                fileApi.apiFilesFileIdSavePost(fileId, {
                    content: initialContent,
                }).catch(err => console.error("Ошибка при сохранении:", err));
            })
            .catch(err => {
                console.error("Ошибка при создании файла:", err);
                alert(`Ошибка при создании файла: ${err.message}`);
            });
    };

    const updateDocPath = (fileId: string, newPath: string) => {
    setDocuments(prev => {
        const newDocs = prev.map(doc => 
            doc.id === fileId ? { ...doc, path: newPath, modified: true } : doc
        );
        return newDocs;
    });
    fileApi.apiFilesFileIdMovePost(fileId, undefined, newPath);
};


    const updateOneDocPath = (id: string, newPath: string) => {
        setDocuments(docs =>
            docs.map(doc => doc.id === id ? { ...doc, path: newPath, modified: true } : doc)
        )
    }

    const updatePath = (id: string, oldPath: string, newPath: string) => {
        setDocuments(prevDocs =>
        prevDocs.map(doc => {
            if (doc.path?.startsWith(oldPath)) {
                const newDocPath = doc.path.replace(oldPath, newPath);
                return { ...doc, path: newDocPath, modified: true };
            }
            return doc;
        })
    );
        fileApi.apiFilesProjectProjectIdChangeAllPathsPost(id, {oldPath, newPath})
    }

    const updateDocument = (id: string, patch: Partial<EditorDocument>) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;

        // 1. Локальное обновление
        setDocuments(docs =>
            docs.map(doc => doc.id === id ? { ...doc, ...patch, modified: true } : doc)
        );

        // 2. Если меняется имя - отправить на сервер
        if (patch.name !== undefined && patch.name !== doc.name) {
            fileApi.apiFilesFileIdRenamePost(id, {
                name: patch.name
            }).catch(err => {
                console.error("Ошибка при переименовании:", err);
                // Откат если ошибка
                setDocuments(docs =>
                    docs.map(d => d.id === id ? { ...d, name: doc.name } : d)
                );
            });
        }

        // 3. Если меняется контент - сохранить
        if (patch.modified) {
            fileApi.apiFilesFileIdSavePost(id, {
                content: patch.content,
            }).catch(err => console.error("Ошибка при сохранении:", err));
        }
    };


    const deleteDocument = (id: string) => {
        fileApi.apiFilesFileIdDeletePost(id)
            .then(() => setDocuments(docs => docs.filter(doc => doc.id !== id)))
            .catch(err => alert(err));
    };

    const saveAll = () => {
        // Находим измененные документы
        const modifiedDocs = documents.filter(doc => doc.modified);

        if (modifiedDocs.length === 0) {
            console.log("Нет изменений для сохранения");
            return;
        }

        console.log(`Сохранение ${modifiedDocs.length} файлов`);

        // Создаем массив промисов для сохранения
        const savePromises = modifiedDocs.map(doc =>
            fileApi.apiFilesFileIdSavePost(doc.id, {
                content: doc.content
            })
        );

        // Выполняем все запросы
        Promise.all(savePromises)
            .then(() => {
                // После успешного сохранения всех файлов сбрасываем флаг modified
                setDocuments(docs =>
                    docs.map(doc => ({
                        ...doc,
                        // Если документ был среди измененных - сбрасываем флаг
                        modified: modifiedDocs.some(md => md.id === doc.id) ? false : doc.modified
                    }))
                );
                console.log("Все файлы сохранены");
            })
            .catch(error => {
                console.error("Ошибка при сохранении:", error);
                alert("Ошибка сохранения файлов");
            });
    };

    const run = async () => {
        await saveAll()
        setOutput("Запуск программы...")
        const res = await compilerApi.apiCompileProjectProjectIdRunPost(projectId, {
            mainFile: "ConsoleApp.csproj"
        });

        setOutput(res.data.output ?? "");

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
        updatePath,
        updateDocPath,
        updateDocument,
        deleteDocument,
        updateOneDocPath,
        run,
        stop,
        output,
        saveAll,
        history: [],
    };
}

