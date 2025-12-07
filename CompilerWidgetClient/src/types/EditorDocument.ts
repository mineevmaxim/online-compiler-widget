export interface EditorDocument {
    id: string;
    path: string;
    name: string;
    language: "javascript" | "csharp";
    content: string;
    modified: boolean;
}