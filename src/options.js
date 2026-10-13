// Source: Notion, "GOMMA Studio Pricing Model". Keep the lists below in sync with quote/index.html.
export const PRICING = {
  projectRate: 65, // USD per hour
  baseRate: 50,
  capacityHoursPerDay: 4,
  revisionRounds: 2,
  validityDays: 30,
  depositPercent: 50,
};

// days: working days available; surcharge: rush +30% (< 5 working days), same-day +50%. Surcharges do not stack.
export const TIMELINES = {
  'Same day': { days: 1, surcharge: 0.5 },
  'Under 5 working days': { days: 4, surcharge: 0.3 },
  '1 to 2 weeks': { days: 10, surcharge: 0 },
  '2 to 4 weeks': { days: 20, surcharge: 0 },
  '1 to 3 months': { days: 60, surcharge: 0 },
  'More than 3 months': { days: 130, surcharge: 0 },
  Flexible: { days: null, surcharge: 0 },
};

// Deliverable name on the form -> type the estimator uses.
export const INCLUDES = {
  'Brand identity': 'identity',
  Website: 'website',
  Packaging: 'packaging',
  'Motion or video': 'motion',
  'Signage and print': 'signage',
};

export const BUDGETS = {
  'Under $1,000': { low: 0, high: 1000 },
  '$1,000 to $3,000': { low: 1000, high: 3000 },
  '$3,000 to $7,500': { low: 3000, high: 7500 },
  '$7,500 to $15,000': { low: 7500, high: 15000 },
  '$15,000 or more': { low: 15000, high: Infinity },
  'Not sure yet': null,
};

export const ITEM_TYPES = [...Object.values(INCLUDES), 'other'];
