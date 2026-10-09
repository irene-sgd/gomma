const clean = (value) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';

const cleanMultiline = (value) =>
  typeof value === 'string'
    ? value
        .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/ ?\n ?/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

export function validateLead(body) {
  const input = body && typeof body === 'object' ? body : {};
  const lead = {};
  const errors = {};

  for (const [key, min, max] of [['contactName', 2, 100], ['companyName', 2, 120]]) {
    const value = clean(input[key]);
    if (value.length < min || value.length > max) errors[key] = `Enter ${min}-${max} characters.`;
    else lead[key] = value;
  }

  const email = clean(input.contactEmail);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = 'Enter a valid email.';
  else lead.contactEmail = email.toLowerCase();

  const project = cleanMultiline(input.project);
  if (project.length < 10 || project.length > 1000) errors.project = 'Enter 10-1000 characters.';
  else lead.project = project;

  return Object.keys(errors).length ? { errors } : { lead };
}
