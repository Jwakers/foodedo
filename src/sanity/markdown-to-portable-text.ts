import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent, PhrasingContent, Text } from "mdast";

type MdastNode = Root | RootContent;

class MarkdownToPortableTextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarkdownToPortableTextError";
  }
}

/** Portable Text block (Sanity block content). */
export type PortableTextBlock = {
  _type: "block";
  _key: string;
  style: string;
  children: PortableTextSpan[];
  markDefs?: { _type: "link"; _key: string; href: string }[];
  listItem?: "bullet" | "number";
  level?: number;
};

/** Portable Text span (inline). */
export type PortableTextSpan = {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
};

let keyCounter = 0;
function genKey(prefix: string): string {
  return `${prefix}-${(keyCounter++).toString(36)}`;
}

function resetKeys(): void {
  keyCounter = 0;
}

/**
 * Converts a Markdown string to Sanity Portable Text blocks.
 * Supports headings (h1–h3), paragraphs, lists (bullet/number), links, bold, italic, code.
 */
export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  resetKeys();
  linkKeyIdx = 0;
  globalLinkMap.clear();
  const tree = unified()
    .use(remarkParse, { gfm: true })
    .use(remarkGfm)
    .parse(markdown) as Root;

  const blocks: PortableTextBlock[] = [];
  const markDefs: PortableTextBlock["markDefs"] = [];

  for (const node of tree.children) {
    const out = nodeToBlocks(node, markDefs);
    for (const block of out) {
      if (block.markDefs?.length) {
        block.markDefs.forEach((def) => markDefs.push(def));
      }
      blocks.push(block);
    }
  }

  return blocks;
}

function nodeToBlocks(
  node: MdastNode,
  globalMarkDefs: PortableTextBlock["markDefs"]
): PortableTextBlock[] {
  switch (node.type) {
    case "heading": {
      const style = `h${Math.min(node.depth ?? 1, 3)}` as "h1" | "h2" | "h3";
      const children = phrasingToSpans(node.children, globalMarkDefs);
      if (children.length === 0) return [];
      return [
        {
          _type: "block",
          _key: genKey("h"),
          style,
          children,
          markDefs: collectMarkDefs(children),
        },
      ];
    }
    case "paragraph": {
      const children = phrasingToSpans(node.children, globalMarkDefs);
      if (children.length === 0)
        return [
          {
            _type: "block",
            _key: genKey("p"),
            style: "normal",
            children: [{ _type: "span", _key: genKey("s"), text: "" }],
          },
        ];
      return [
        {
          _type: "block",
          _key: genKey("p"),
          style: "normal",
          children,
          markDefs: collectMarkDefs(children),
        },
      ];
    }
    case "list": {
      return listToBlocks(node as unknown as { ordered?: boolean; children?: unknown[] }, globalMarkDefs, 1);
    }
    case "blockquote": {
      const out: PortableTextBlock[] = [];
      for (const child of node.children ?? []) {
        if (child.type === "paragraph") {
          const children = phrasingToSpans(child.children, globalMarkDefs);
          out.push({
            _type: "block",
            _key: genKey("bq"),
            style: "blockquote",
            children: children.length
              ? children
              : [{ _type: "span", _key: genKey("s"), text: "" }],
            markDefs: collectMarkDefs(children),
          });
          continue;
        }
        throw unsupportedNodeError("nodeToBlocks(blockquote)", child);
      }
      return out;
    }
    case "thematicBreak":
      // Preserve content explicitly rather than silently dropping it.
      return [
        {
          _type: "block",
          _key: genKey("hr"),
          style: "normal",
          children: [{ _type: "span", _key: genKey("s"), text: "---", marks: [] }],
        },
      ];
    case "code": {
      const codeNode = node as unknown as { lang?: string | null; value?: string };
      const lang = codeNode.lang ? String(codeNode.lang) : "";
      const value = String(codeNode.value ?? "");
      const text = ["```" + lang, value.replace(/\n$/, ""), "```"].join("\n");
      return [
        {
          _type: "block",
          _key: genKey("code"),
          style: "normal",
          children: [{ _type: "span", _key: genKey("s"), text, marks: ["code"] }],
        },
      ];
    }
    default:
      throw unsupportedNodeError("nodeToBlocks", node);
  }
}

function listToBlocks(
  listNode: { ordered?: boolean; children?: unknown[] },
  globalMarkDefs: PortableTextBlock["markDefs"],
  level: number
): PortableTextBlock[] {
  const listItemStyle: PortableTextBlock["listItem"] = listNode.ordered ? "number" : "bullet";
  const blocks: PortableTextBlock[] = [];
  const items = (listNode.children ?? []) as Array<{ type?: string; children?: unknown[] }>;

  for (const item of items) {
    if (item.type !== "listItem") {
      throw unsupportedNodeError("nodeToBlocks(list)", item);
    }
    for (const rawChild of item.children ?? []) {
      const child = rawChild as { type?: string; children?: unknown[] };
      if (child.type === "paragraph") {
        const phrasing = (child.children ?? []) as unknown as PhrasingContent[];
        const children = phrasingToSpans(phrasing, globalMarkDefs);
        blocks.push({
          _type: "block",
          _key: genKey("li"),
          style: "normal",
          listItem: listItemStyle,
          level,
          children: children.length
            ? children
            : [{ _type: "span", _key: genKey("s"), text: "" }],
          markDefs: collectMarkDefs(children),
        });
        continue;
      }
      if (child.type === "list") {
        blocks.push(
          ...listToBlocks(child as unknown as { ordered?: boolean; children?: unknown[] }, globalMarkDefs, level + 1)
        );
        continue;
      }
      throw unsupportedNodeError("nodeToBlocks(listItem)", child);
    }
  }

  return blocks;
}

function phrasingToSpans(
  nodes: PhrasingContent[],
  globalMarkDefs: PortableTextBlock["markDefs"]
): PortableTextSpan[] {
  const spans: PortableTextSpan[] = [];
  for (const n of nodes) {
    const part = phrasingToSpan(n, globalMarkDefs);
    if (part.length) spans.push(...part);
  }
  return spans;
}

function collectMarkDefs(spans: PortableTextSpan[]): PortableTextBlock["markDefs"] {
  const defs: PortableTextBlock["markDefs"] = [];
  const seen = new Set<string>();
  for (const s of spans) {
    for (const m of s.marks ?? []) {
      if (m.startsWith("link-") && !seen.has(m)) {
        seen.add(m);
        const key = m;
        const href = (globalLinkMap.get(m) ?? "") as string;
        if (href) defs.push({ _type: "link", _key: key, href });
      }
    }
  }
  return defs;
}

let linkKeyIdx = 0;
const globalLinkMap = new Map<string, string>();

function phrasingToSpan(
  node: PhrasingContent,
  globalMarkDefs: PortableTextBlock["markDefs"]
): PortableTextSpan[] {
  switch (node.type) {
    case "text": {
      const text = (node as Text).value ?? "";
      if (!text) return [];
      return [{ _type: "span", _key: genKey("s"), text, marks: [] }];
    }
    case "strong": {
      const inner = phrasingToSpans(node.children, globalMarkDefs);
      inner.forEach((s) => {
        s.marks = [...(s.marks ?? []), "strong"];
      });
      return inner;
    }
    case "emphasis": {
      const inner = phrasingToSpans(node.children, globalMarkDefs);
      inner.forEach((s) => {
        s.marks = [...(s.marks ?? []), "em"];
      });
      return inner;
    }
    case "inlineCode": {
      const value = "value" in node ? String((node as { value?: string }).value ?? "") : "";
      return [{ _type: "span", _key: genKey("s"), text: value, marks: ["code"] }];
    }
    case "break": {
      // Hard line break
      return [{ _type: "span", _key: genKey("s"), text: "\n", marks: [] }];
    }
    case "delete": {
      const inner = phrasingToSpans((node as unknown as { children: PhrasingContent[] }).children, globalMarkDefs);
      inner.forEach((s) => {
        s.marks = [...(s.marks ?? []), "strike-through"];
      });
      return inner;
    }
    case "link": {
      const href = (node as { url?: string }).url ?? "";
      const linkKey = `link-${(linkKeyIdx++).toString(36)}`;
      globalLinkMap.set(linkKey, href);
      const inner = phrasingToSpans(node.children, globalMarkDefs);
      inner.forEach((s) => {
        s.marks = [...(s.marks ?? []), linkKey];
      });
      return inner;
    }
    default:
      throw unsupportedNodeError("phrasingToSpan", node);
  }
}

function unsupportedNodeError(where: string, node: unknown): MarkdownToPortableTextError {
  const type = (node as { type?: unknown })?.type;
  if (type === "image") {
    const url = (node as { url?: unknown })?.url;
    const alt = (node as { alt?: unknown })?.alt;
    return new MarkdownToPortableTextError(
      `Unsupported Markdown node in ${where}: image (url=${String(url ?? "")}, alt=${String(alt ?? "")}). Images are not yet supported by the draft creator.`
    );
  }
  if (type === "table") {
    return new MarkdownToPortableTextError(
      `Unsupported Markdown node in ${where}: table. Tables are not yet supported by the draft creator.`
    );
  }
  return new MarkdownToPortableTextError(
    `Unsupported Markdown node in ${where}: ${String(type ?? "unknown")}. Please remove or simplify this content (or we can add support).`
  );
}
