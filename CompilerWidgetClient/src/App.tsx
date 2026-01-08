import React, { useState, useMemo, useLayoutEffect } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    applyNodeChanges,
    applyEdgeChanges
} from "@xyflow/react";
import type { Node, Edge, NodeTypes } from "@xyflow/react"; // <— тут правильно
import "@xyflow/react/dist/style.css";
import CompilerWidget from "./components/CompilerWidget";
import { getInfo, type GetInfoModel } from "./getInfo";

const initialNodes: Node[] = [
    {
        id: "1",
        type: "compiler",
        position: { x: 100, y: 100 },
        dragHandle: ".drag-handle__custom",
        data: {
            initialFiles: {
                "ConsoleApp.csproj":
                    '<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>net8.0</TargetFramework>\n  </PropertyGroup>\n</Project>',
                "Program.cs":
                    'using System;\n\nnamespace ConsoleApp\n{\n    class Program\n    {\n        static void Main(string[] args)\n        {\n            Console.WriteLine("Hello from compiled C#!");\n            Console.WriteLine($"Current time: {DateTime.Now}");\n        }\n    }\n}'
            },
            language: "csharp"
        },
        style: {
            width: 700,
            height: 400
        }
    }
];

const initialEdges: Edge[] = [];

export default function App() {
    const widgetId = "143e4577-e89b-12d3-a456-426614174000";

    const [isNew, setIsNew] = useState<boolean | null>(null);

    const model: GetInfoModel = {
        widgetId: widgetId,
        userId: 123,
        board: {
            id: 123,
            name: 'asd',
            parentId: 132
        },
        config: "",
        role: "ads"
    }

    useLayoutEffect(() => {
        getInfo(model)
            .then(res => {
                console.log(res);
                setIsNew(res)
            })
    }, [])

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const setNodeHeight = (id: string, height: number) => {
        setNodes(nds =>
            nds.map(n =>
                n.id === id ? { ...n, style: { ...n.style, height } } : n
            )
        );
    };

    const nodeTypes: NodeTypes = useMemo(
        () => ({
            compiler: (props) => <CompilerWidget id={widgetId} isNew={isNew ?? true} data={props.data} setNodeHeight={setNodeHeight} />
        }), [isNew, widgetId]
    );

    if (isNew === null) {
        return <div>Загрузка проекта...</div>; // Ранний return, useMemo не вызывается!
    }

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={(changes) =>
                    setNodes((nds) => applyNodeChanges(changes, nds))
                }
                onEdgesChange={(changes) =>
                    setEdges((eds) => applyEdgeChanges(changes, eds))
                }
                fitView
                minZoom={0.2}
                maxZoom={4}
            >
                <Background variant={BackgroundVariant.Dots} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
