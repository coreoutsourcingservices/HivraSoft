// Keep existing multiline text readable when moving it into the HTML editor.
export function editorContentHtml(value: string): string {
  if (!value || /<[a-z][\w:-]*\b[^>]*>/i.test(value)) return value;
  return '<p>' + value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\r\n?|\n/g, '<br>') + '</p>';
}
