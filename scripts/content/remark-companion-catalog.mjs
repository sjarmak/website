function text(node) {
  if (typeof node.value === "string") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(text).join("");
}

function properties(node) {
  node.data ??= {};
  node.data.hProperties ??= {};
  return node.data.hProperties;
}

export default function remarkCompanionCatalog() {
  return (tree) => {
    if (!Array.isArray(tree.children)) return;

    const chapterHeadings = tree.children.filter(
      (node) => node.type === "heading" && node.depth === 2 && /^Chapter \d+:/.test(text(node)),
    );
    if (chapterHeadings.length !== 18) return;

    let practiceClass;
    for (let index = 0; index < tree.children.length; index += 1) {
      const node = tree.children[index];
      const nodeText = text(node);

      if (node.type === "heading" && node.depth === 2) {
        const chapter = nodeText.match(/^Chapter (\d+):/);
        if (chapter) properties(node).id = `chapter-${chapter[1]}`;
        practiceClass = undefined;
        continue;
      }

      if (node.type === "paragraph" && nodeText.startsWith("The following pointer entries")) {
        practiceClass = "taught";
        properties(node).className = [
          "catalog-group-label",
          "catalog-group-label--taught",
        ];
        continue;
      }

      if (node.type === "paragraph" && nodeText.startsWith("The following compact entries")) {
        practiceClass = "untaught";
        properties(node).className = [
          "catalog-group-label",
          "catalog-group-label--untaught",
        ];
        continue;
      }

      if (node.type !== "heading" || node.depth !== 3 || !practiceClass) continue;
      const idParagraph = tree.children[index + 1];
      const idNode =
        idParagraph?.type === "paragraph" &&
        idParagraph.children?.length === 1 &&
        idParagraph.children[0]?.type === "inlineCode"
          ? idParagraph.children[0]
          : undefined;
      const id = idNode?.value;
      if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
        throw new Error(`Companion practice "${nodeText}" is missing its stable id`);
      }

      properties(node).id = id;
      properties(node).className = [
        "catalog-practice",
        `catalog-practice--${practiceClass}`,
      ];
      properties(idParagraph).className = ["catalog-practice-id"];
      idParagraph.children = [
        {
          type: "link",
          url: `#${id}`,
          children: [idNode],
        },
      ];
    }
  };
}
