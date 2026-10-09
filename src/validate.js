import { BUDGETS, INCLUDES, TIMELINES } from './options.js';

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

  // Optional details from the quote form travel with the project text.
  const extras = [];
  const timeline = clean(input.timeline);
  if (timeline) {
    if (Object.hasOwn(TIMELINES, timeline)) extras.push(`Timeline: ${timeline}`);
    else errors.timeline = 'Choose a timeline.';
  }
  const included = Array.isArray(input.included) ? input.included : [];
  if (!included.every((name) => typeof name === 'string' && Object.hasOwn(INCLUDES, name))) errors.included = 'Unknown deliverable.';
  else if (included.length) extras.push(`Includes: ${included.join(', ')}`);
  const budget = clean(input.budget);
  if (budget) {
    if (Object.hasOwn(BUDGETS, budget)) extras.push(`Budget: ${budget}`);
    else errors.budget = 'Unknown budget.';
  }
  if (!errors.project) lead.project = [project, ...(extras.length ? ['', ...extras] : [])].join('\n');

  return Object.keys(errors).length ? { errors } : { lead };
}
