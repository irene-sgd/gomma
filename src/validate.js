export const PROJECT_TYPES = ['Culture and social causes', 'Music', 'Corporate', 'Artists'];

const clean = (value, multiline = false) =>
  typeof value === 'string'
    ? value
        .replace(multiline ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim()
    : '';

export function normalizeWebsite(raw) {
  let value = clean(raw);
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const isPublicHost =
    /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) &&
    !/^\d+(\.\d+){3}$/.test(host) &&
    !/\.(local|localhost|internal|lan|home)$/.test(host);
  if (!isPublicHost || url.username || url.password) return null;
  url.hash = '';
  return url.toString();
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().startsWith(value) &&
    date.getUTCFullYear() >= 1800 &&
    date.getTime() <= Date.now()
  );
}

// text fields: [key, label, min, max, multiline]
const TEXT_FIELDS = [
  ['companyName', 2, 120, false],
  ['country', 2, 80, false],
  ['founders', 2, 500, true],
  ['teamStructure', 5, 1000, true],
  ['budgetRange', 1, 60, false],
  ['timeline', 1, 60, false],
  ['contactName', 2, 100, false],
];

export function validateLead(body) {
  const input = body && typeof body === 'object' ? body : {};
  const lead = {};
  const errors = {};

  for (const [key, min, max, multiline] of TEXT_FIELDS) {
    const value = clean(input[key], multiline);
    if (value.length < min || value.length > max) errors[key] = `Enter ${min}-${max} characters.`;
    else lead[key] = value;
  }

  const website = normalizeWebsite(input.website);
  if (!website || website.length > 200) errors.website = 'Enter a public website address.';
  else lead.website = website;

  const email = clean(input.contactEmail);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = 'Enter a valid email.';
  else lead.contactEmail = email.toLowerCase();

  if (!PROJECT_TYPES.includes(input.projectType)) errors.projectType = 'Choose a project type.';
  else lead.projectType = input.projectType;

  const registrationNumber = clean(input.registrationNumber);
  if (registrationNumber.length > 60) errors.registrationNumber = 'Keep it under 60 characters.';
  else lead.registrationNumber = registrationNumber;

  const registrationDate = clean(input.registrationDate);
  if (registrationDate && !validDate(registrationDate)) errors.registrationDate = 'Enter a valid past date.';
  else lead.registrationDate = registrationDate;

  return Object.keys(errors).length ? { errors } : { lead };
}
