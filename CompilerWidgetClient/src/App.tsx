import React, { useState, useMemo } from "react";
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

const initialNodes: Node[] = [
    {
        id: "1",
        type: "compiler",
        position: { x: 100, y: 100 },
        dragHandle: ".drag-handle__custom",
        data: {
            initialFiles: {
                "Program.cs":
                    'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello from C#!");\n    }\n}',
                "Utils.cs":
                    'public static class Utils\n{\n    public static string GetMessage() => "From Utils";\n}'
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
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const setNodeHeight = (id: string, height: number) => {
        setNodes(nds =>
            nds.map(n =>
                n.id === id ? { ...n, style: { ...n.style, height } } : n
            )
        );
    };

    // типизация через NodeTypes
    const nodeTypes: NodeTypes = useMemo(
        () => ({
            compiler: (props) => <CompilerWidget {...props} setNodeHeight={setNodeHeight} />
        }),
        []
    );

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
