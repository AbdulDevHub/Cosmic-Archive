// A remark plugin for the subject pages' MDX (wired up in next.config.ts).
//
// MDX unwraps a paragraph that holds nothing but JSX: a paragraph written as
//   <Claim source="a">One sentence.</Claim> <Claim source="b">Another.</Claim>
// reaches the page as two bare elements with no <p> around them. On a page where most sentences
// are claims that is most paragraphs. This puts the paragraph back: each run of neighbouring
// <Claim> elements standing where a block should be becomes one paragraph again.

const isLooseClaim = (node) => node.type === "mdxJsxFlowElement" && node.name === "Claim";

function wrap(parent) {
  if (!Array.isArray(parent.children)) return;
  const next = [];
  for (const child of parent.children) {
    if (!isLooseClaim(child)) {
      wrap(child);
      next.push(child);
      continue;
    }
    const inline = { ...child, type: "mdxJsxTextElement" };
    const last = next[next.length - 1];
    // a blank line in the source still ends the paragraph
    const after = last?.children?.[last.children.length - 1]?.position?.end?.line;
    const before = child.position?.start?.line;
    const joined = after === undefined || before === undefined || before <= after + 1;
    if (last?.type === "paragraph" && last.data?.claimRun && joined) last.children.push({ type: "text", value: " " }, inline);
    else next.push({ type: "paragraph", data: { claimRun: true }, children: [inline] });
  }
  parent.children = next;
}

export default function remarkClaimParagraphs() {
  return (tree) => wrap(tree);
}
