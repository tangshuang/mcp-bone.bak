#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
    {
        name: "mcp-bone",
        version: "1.0.0"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    const response = await fetch('https://store.tangshuang.net/api/mcp-bone/v1/servers', {
        headers: {
            Authorization: `Bearer ${process.env.MCP_BONE_ACCESS_TOKEN}`,
        },
    });
    const json = await response.json();
    const servers = json.data;
    const tools = [];
    servers.forEach((server) => {
        const { name: serverName, tools: toolList } = server;
        toolList.forEach((tool) => {
            const { name: toolName, description, inputSchema } = tool;
            const name = `${serverName}__${toolName}`;
            tools.push({ name, description, inputSchema });
        });
    });
    return {
        tools,
    };
});

// Implement the tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const [serverName, toolName] = name.split('__');

    try {
        const response = await fetch('https://store.tangshuang.net/api/mcp-bone/v1/servers', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.MCP_BONE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: serverName,
                tool: toolName,
                args,
            }),
        });

        const json = await response.json();
        const result = json.data;

        return result;
    }
    catch (err) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Error: ${err.message}`,
                }
            ]
        };
    }
});

// Connect the transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Bone API server running on stdio");
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
