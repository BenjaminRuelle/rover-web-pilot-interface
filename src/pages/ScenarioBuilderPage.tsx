
import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Navbar from '@/components/Navbar';
import ScenarioToolbar from '@/components/ScenarioToolbar';
import NodeConfigSidebar from '@/components/NodeConfigSidebar';
import { ScenarioNode, NodeType } from '@/types/scenario';
import { ConditionNode } from '@/components/nodes/ConditionNode';
import { ActionNode } from '@/components/nodes/ActionNode';
import { LogicNode } from '@/components/nodes/LogicNode';

const nodeTypes = {
  condition: ConditionNode,
  action: ActionNode,
  logic: LogicNode,
};

const ScenarioBuilderPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as ScenarioNode);
    setIsSidebarOpen(true);
  }, []);

  const addNode = useCallback((type: NodeType) => {
    const id = `${type}-${Date.now()}`;
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
    
    const newNode: ScenarioNode = {
      id,
      type,
      position,
      data: {
        label: getDefaultLabel(type),
        config: getDefaultConfig(type),
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const updateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  }, [setNodes]);

  const exportScenario = useCallback(() => {
    const scenario = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };
    
    console.log('Exported Scenario:', JSON.stringify(scenario, null, 2));
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(scenario, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="pt-16 h-screen flex">
        {/* Toolbar */}
        <ScenarioToolbar onAddNode={addNode} onExport={exportScenario} />
        
        {/* Main canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-800"
          >
            <Controls className="bg-slate-700 border-slate-600" />
            <Background color="#64748b" gap={20} />
          </ReactFlow>
        </div>
        
        {/* Configuration Sidebar */}
        <NodeConfigSidebar
          node={selectedNode}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onUpdateConfig={updateNodeConfig}
        />
      </div>
    </div>
  );
};

const getDefaultLabel = (type: NodeType): string => {
  switch (type) {
    case 'condition':
      return 'New Condition';
    case 'action':
      return 'New Action';
    case 'logic':
      return 'AND';
    default:
      return 'New Node';
  }
};

const getDefaultConfig = (type: NodeType): any => {
  switch (type) {
    case 'condition':
      return { type: 'person_detected', threshold: 0.8 };
    case 'action':
      return { type: 'trigger_alarm', message: 'Alert!' };
    case 'logic':
      return { operator: 'AND' };
    default:
      return {};
  }
};

export default ScenarioBuilderPage;
