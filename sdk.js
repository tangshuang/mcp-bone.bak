function tryParseJson(input, fallback) {
    try {
        return JSON.parse(input);
    }
    catch (e) {
        return fallback;
    }
}

function parseToolXml(xmlContent) {
    const toolNameRegex = /<tool_name>\s*(.*?)\s*<\/tool_name>/;
    const toolNameMatch = xmlContent.match(toolNameRegex);
    const toolName = toolNameMatch ? toolNameMatch[1] : null;

    const argumentsRegex = /<arguments>\s*([\s\S]*?)\s*<\/arguments>/;
    const argumentsMatch = xmlContent.match(argumentsRegex);

    const jsonResult = {
        type: 'function',
        function: {
            name: toolName,
            arguments: argumentsMatch[1],
        },
    };

    return jsonResult;
}

export function extractAndParseToolsToJson(text) {
    let tools = extractAndParseToolsXmlToJson(text);
    if (!tools || !tools.length) {
        tools = extractAndParseToolsTextToJson(text);
    }
    return tools;
}

export function extractAndParseToolsXmlToJson(text) {
    const regex = /<use_tool>\s*([\s\S]*?)\s*<\/use_tool>/g;
    const match = text.match(regex);
    if (match && match.length ) {
        const results = match.map(text => parseToolXml(text.trim())).filter(Boolean);
        return results;
    }

    // console.log("未找到 <use_tool> 标签或其内容。");
    return [];
}

export function extractAndParseToolsTextToJson(text) {
    // 极简主义的返回结果
    if (text.includes('use_tool') && text.includes('<tool_name>') && text.includes('<arguments>')) {
        // 补充上</arguments>避免没有返回
        if (text.endsWith('}')) {
            text += '</arguments>';
        }
        return [parseToolXml(text)].filter(Boolean);
    }

    // 超极简主义
    const lines = text.split('\n');
    if (lines.length === 2) {
        const [toolName, args_json_str] = lines;

        // 验证是否可以正常解析为json
        const args_json = tryParseJson(args_json_str);
        if (!args_json) {
            return [];
        }

        const func = {
            type: 'function',
            function: {
                name: toolName,
                arguments: args_json_str,
            },
        };
        return [func];
    }

    if (text.includes('<arguments>')) {
        const index = text.indexOf('<arguments>');
        const tool_name = text.substring(0, index).trim();
        const right_text = text.substring(index).trim();
        const args_xml_str = right_text.includes('</arguments>') ? right_text : right_text + '</arguments>';
        const args_json_str = args_xml_str.match(/<arguments>([\s\S]*?)<\/arguments>/)[1];

        // 验证是否可以正常解析为json
        const args_json = tryParseJson(args_json_str);
        if (!args_json) {
            return [];
        }

        const func = {
            type: 'function',
            function: {
                name: tool_name,
                arguments: args_json_str,
            },
        };
        return [func];
    }

    return [];
}