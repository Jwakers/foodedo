import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent, PhrasingContent, Text } from "mdast";

type MdastNode = Root | RootContent;

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
      const listItemStyle = node.ordered ? "number" : "bullet";
      const listBlocks: PortableTextBlock[] = [];
      for (const item of node.children) {
        if (item.type !== "listItem") continue;
        const firstParagraph = item.children?.[0];
        if (firstParagraph?.type === "paragraph") {
          const children = phrasingToSpans(firstParagraph.children, globalMarkDefs);
          listBlocks.push({
            _type: "block",
            _key: genKey("li"),
            style: "normal",
            listItem: listItemStyle,
            level: 1,
            children: children.length ? children : [{ _type: "span", _key: genKey("s"), text: "" }],
            markDefs: collectMarkDefs(children),
          });
        }
      }
      return listBlocks;
    }
    case "blockquote": {
      const firstChild = node.children?.[0];
      if (firstChild?.type === "paragraph") {
        const children = phrasingToSpans(firstChild.children, globalMarkDefs);
        return [
          {
            _type: "block",
            _key: genKey("bq"),
            style: "blockquote",
            children: children.length ? children : [{ _type: "span", _key: genKey("s"), text: "" }],
            markDefs: collectMarkDefs(children),
          },
        ];
      }
      return [];
    }
    case "thematicBreak":
      return [];
    default:
      return [];
  }
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
      return phrasingToSpans("children" in node ? (node as { children: PhrasingContent[] }).children : [], globalMarkDefs);
  }
}
