import { createDefaultChromeMcpDispatcher } from "../mcp-server.ts";

async function main() {
  const dispatch = createDefaultChromeMcpDispatcher();

  console.log("1. Hot reloading extension / verifying Chrome connection...");
  const hotRes = await dispatch({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "browser", arguments: { action: "status" } },
  });
  console.log("Status:", hotRes?.result?.content?.[0]?.text);

  console.log("\n2. Disassembling design system catalog via Chrome plugin...");
  const disRes = await dispatch({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "browser",
      arguments: {
        action: "disassemble",
        url: "http://localhost:5173/foundation/layout",
        max_sections: 10,
      },
    },
  });

  const parsed = JSON.parse(disRes?.result?.content?.[0]?.text || "{}");
  console.log("\nDisassembly Result Summary:");
  console.log("- Page Title:", parsed.title);
  console.log("- Theme Mode:", parsed.theme);
  console.log("- Total Colors Extracted:", parsed.tokens?.colors?.length);
  console.log("- Top Colors:", parsed.tokens?.colors?.slice(0, 5));
  console.log("- Top Radii:", parsed.tokens?.radii);
  console.log("- Top Fonts:", parsed.tokens?.fonts);
  console.log("- Headings Hierarchy:", Object.keys(parsed.tokens?.typography?.headings || {}));
  console.log("- Structural Sections Identified:", parsed.sections?.length);
  if (parsed.sections) {
    parsed.sections.forEach((sec, idx) => {
      console.log(`  [Section ${idx + 1}] Archetype: <${sec.archetype}>, Tag: <${sec.tagName}>, Title: "${sec.title}"`);
    });
  }
}

main().catch(console.error);
