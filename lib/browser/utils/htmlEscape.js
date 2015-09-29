var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '/': '&#x2F;'
};

export default function escapeHtml(string) {
  return String(string).replace(/[&<>"'\/]/g, str => entityMap[str] );
}