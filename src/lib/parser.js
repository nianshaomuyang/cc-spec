let nextId = 0;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `section-${nextId++}`;
}

/**
 * 将 SPEC.md 按 H2/H3 切片为章节树
 * 返回 [{ id, title, level, content, children }]
 */
export function parseSpec(content) {
  nextId = 0;
  const lines = content.split('\n');
  const sections = [];
  const stack = []; // 用于维护层级关系

  let current = null;
  let buffer = [];

  const flush = () => {
    if (current) {
      current.content = buffer.join('\n').trim();
      buffer = [];
    }
  };

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h2Match) {
      flush();
      current = {
        id: slugify(h2Match[1]),
        title: h2Match[1],
        level: 2,
        content: '',
        children: [],
      };
      sections.push(current);
      stack.length = 0;
      stack.push(current);
    } else if (h3Match) {
      flush();
      const parent = stack.length > 0 ? stack[0] : current;
      current = {
        id: slugify(h3Match[1]),
        title: h3Match[1],
        level: 3,
        content: '',
        children: [],
      };
      if (parent && parent.level === 2) {
        parent.children.push(current);
      } else {
        sections.push(current);
      }
    } else {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}
