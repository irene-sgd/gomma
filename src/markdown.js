const MAX = 2000;

function richText(text) {
  const out = [];
  const push = (content, extra = {}) => {
    for (let i = 0; i < content.length; i += MAX) {
      out.push({ type: 'text', text: { content: content.slice(i, i + MAX), ...(extra.link && { link: extra.link }) }, ...(extra.annotations && { annotations: extra.annotations }) });
    }
  };
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > last) push(text.slice(last, match.index));
    if (match[1]) push(match[1], { link: { url: match[2] } });
    else push(match[3], { annotations: { bold: true } });
    last = pattern.lastIndex;
  }
  if (last < text.length) push(text.slice(last));
  return out;
}

const isTableRow = (line) => line.trim().startsWith('|');
const isSeparator = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

function tableBlock(rows) {
  const width = rows[0].length;
  return {
    type: 'table',
    table: {
      table_width: width,
      has_column_header: true,
      has_row_header: false,
      children: rows.map((row) => ({
        type: 'table_row',
        table_row: { cells: Array.from({ length: width }, (_, i) => richText(row[i] || '')) },
      })),
    },
  };
}

export function markdownToBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    if (isTableRow(line) && isSeparator(lines[i + 1] || '')) {
      const rows = [cells(line)];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      i--;
      blocks.push(tableBlock(rows));
      continue;
    }

    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (heading) blocks.push({ type: 'heading_3', heading_3: { rich_text: richText(heading[1]) } });
    else if (bullet) blocks.push({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText(bullet[1]) } });
    else if (numbered) blocks.push({ type: 'numbered_list_item', numbered_list_item: { rich_text: richText(numbered[1]) } });
    else blocks.push({ type: 'paragraph', paragraph: { rich_text: richText(line.trim()) } });
  }
  return blocks;
}
