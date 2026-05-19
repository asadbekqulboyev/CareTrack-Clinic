/**
 * Lightweight schema validator middleware (no external dep).
 * Each rule entry: { field, required?, type?, min?, max?, in?, pattern?, label? }
 * type: 'string' | 'email' | 'int' | 'number' | 'date' | 'boolean'
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkType(value, type) {
  switch (type) {
    case 'string':  return typeof value === 'string';
    case 'email':   return typeof value === 'string' && EMAIL_RE.test(value);
    case 'int':     return Number.isInteger(Number(value)) && String(value).trim() !== '';
    case 'number':  return !isNaN(Number(value)) && String(value).trim() !== '';
    case 'date':    return !isNaN(new Date(value).getTime());
    case 'boolean': return typeof value === 'boolean' || value === 'true' || value === 'false';
    default:        return true;
  }
}

function validate(rules) {
  return (req, res, next) => {
    const errors = [];
    const data = { ...req.body };

    for (const rule of rules) {
      const { field, required, type, min, max, in: allowed, pattern, label } = rule;
      const name = label || field;
      const val = data[field];
      const empty = val === undefined || val === null || val === '';

      if (required && empty) {
        errors.push(`${name} talab qilinadi`);
        continue;
      }
      if (empty) continue;

      if (type && !checkType(val, type)) {
        errors.push(`${name} noto'g'ri formatda`);
        continue;
      }

      if (type === 'string' || !type) {
        if (min != null && String(val).length < min) errors.push(`${name} kamida ${min} ta belgidan iborat bo'lishi kerak`);
        if (max != null && String(val).length > max) errors.push(`${name} ${max} ta belgidan oshmasligi kerak`);
      }
      if (type === 'int' || type === 'number') {
        const n = Number(val);
        if (min != null && n < min) errors.push(`${name} kamida ${min} bo'lishi kerak`);
        if (max != null && n > max) errors.push(`${name} ${max} dan katta bo'lmasligi kerak`);
      }
      if (allowed && !allowed.includes(val)) {
        errors.push(`${name} qiymati noto'g'ri (${allowed.join(', ')} dan biri bo'lishi kerak)`);
      }
      if (pattern && !pattern.test(String(val))) {
        errors.push(`${name} formati noto'g'ri`);
      }
    }

    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Validatsiya xatosi', errors });
    }
    next();
  };
}

module.exports = { validate };
