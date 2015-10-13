export default function smartTypeCast(value) {
  value = String(value);
  if (value.trim() && ! isNaN(Number(value)) && value.length < 17) {
    value = Number(value);
  } else if (value.match(/true/i)) {
    value = true;
  } else if (value.match(/false/i)) {
    value = false;
  }

  return value;
}