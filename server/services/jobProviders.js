const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';
const INDIA_TERMS = ['india', 'in', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'mumbai', 'gurugram', 'gurgaon', 'noida', 'chennai', 'delhi', 'kolkata', 'ahmedabad', 'kochi'];

const QUERY_CACHE_TTL_MS = Number.parseInt(process.env.JOB_CACHE_TTL_MS || '300000', 10);
const PROVIDER_TIMEOUT_MS = Number.parseInt(process.env.JOB_PROVIDER_TIMEOUT_MS || '12000', 10);
const RATE_WINDOW_MS = Number.parseInt(process.env.JOB_PROVIDER_RATE_WINDOW_MS || '60000', 10);
const RAPIDAPI_RATE_LIMIT = Number.parseInt(process.env.RAPIDAPI_RATE_LIMIT_PER_WINDOW || '20', 10);
const ADZUNA_RATE_LIMIT = Number.parseInt(process.env.ADZUNA_RATE_LIMIT_PER_WINDOW || '20', 10);

const queryCache = new Map();
const providerRate = {
  rapidapi: { windowStart: 0, count: 0 },
  adzuna: { windowStart: 0, count: 0 },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertProviderRateLimit(providerName) {
  const state = providerRate[providerName];
  const now = Date.now();
  if (!state) return;

  if (now - state.windowStart > RATE_WINDOW_MS) {
    state.windowStart = now;
    state.count = 0;
  }

  const limit = providerName === 'rapidapi' ? RAPIDAPI_RATE_LIMIT : ADZUNA_RATE_LIMIT;
  if (state.count >= limit) {
    const err = new Error(`${providerName} rate limit reached in current window`);
    err.code = 'PROVIDER_RATE_LIMIT';
    throw err;
  }

  state.count += 1;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function withRetry(task, providerName, maxAttempts = 2) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const nonRetryable = error.code === 'PROVIDER_RATE_LIMIT' || error.code === 'NO_PROVIDER_CONFIG';
      if (nonRetryable || attempt === maxAttempts) break;
      await sleep(300 * attempt);
    }
  }

  throw lastError;
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function inferWorkType(title, location, isRemoteFlag) {
  const haystack = `${title} ${location}`.toLowerCase();
  if (isRemoteFlag || /\bremote\b/.test(haystack)) return 'remote';
  if (/\bhybrid\b/.test(haystack)) return 'hybrid';
  return 'onsite';
}

function inferPaid(stipendText) {
  const txt = (stipendText || '').toLowerCase();
  if (!txt) return null;
  if (/(unpaid|volunteer|without pay)/.test(txt)) return false;
  if (/\d/.test(txt) || /(paid|stipend|salary|compensation)/.test(txt)) return true;
  return null;
}

function toCurrencyText({ min, max, currency = 'USD' }) {
  if (!min && !max) return 'Not disclosed';
  if (min && max) return `${currency} ${min} - ${max}`;
  return `${currency} ${min || max}`;
}

function normalizeRapidApiJob(job, index = 0) {
  const providerId = normalizeText(job.job_id, `rapid_${Date.now()}_${index}`);
  const title = normalizeText(job.job_title, 'Internship');
  const company = normalizeText(job.employer_name, 'Unknown Company');
  const location = normalizeText(job.job_city || job.job_state || job.job_country, 'Remote');
  const description = normalizeText(job.job_description, 'No description provided.');
  const applyLink = normalizeText(job.job_apply_link || job.job_google_link || job.job_offer_expiration_datetime_utc, '#');

  const stipend = toCurrencyText({
    min: job.job_min_salary,
    max: job.job_max_salary,
    currency: normalizeText(job.job_salary_currency, 'USD'),
  });

  const skills = Array.isArray(job.job_highlights?.Qualifications)
    ? job.job_highlights.Qualifications.slice(0, 8)
    : [];

  const type = inferWorkType(title, location, Boolean(job.job_is_remote));

  return {
    _id: `rapidapi_${providerId}`,
    title,
    company,
    company_logo: normalizeText(job.employer_logo, ''),
    location,
    type,
    workMode: type,
    skills_required: skills,
    stipend,
    isPaid: inferPaid(stipend),
    description,
    link: applyLink,
    source: 'RapidAPI JSearch',
    duration: normalizeText(job.job_employment_type, 'Not specified'),
    deadline: normalizeText(job.job_offer_expiration_datetime_utc, ''),
    clicks: 0,
    createdAt: normalizeText(job.job_posted_at_datetime_utc, new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeAdzunaJob(job, index = 0) {
  const providerId = normalizeText(job.id, `adzuna_${Date.now()}_${index}`);
  const title = normalizeText(job.title, 'Internship');
  const company = normalizeText(job.company?.display_name, 'Unknown Company');
  const location = normalizeText(job.location?.display_name, 'Remote');
  const description = normalizeText(job.description, 'No description provided.');
  const applyLink = normalizeText(job.redirect_url, '#');
  const stipend = toCurrencyText({
    min: job.salary_min,
    max: job.salary_max,
    currency: 'USD',
  });

  const type = inferWorkType(title, location, /remote/i.test(description));

  return {
    _id: `adzuna_${providerId}`,
    title,
    company,
    company_logo: '',
    location,
    type,
    workMode: type,
    skills_required: [],
    stipend,
    isPaid: inferPaid(stipend),
    description,
    link: applyLink,
    source: 'Adzuna',
    duration: 'Not specified',
    deadline: '',
    clicks: 0,
    createdAt: normalizeText(job.created, new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
}

function dedupeByApplyLink(items = []) {
  const map = new Map();
  for (const item of items) {
    if (!item || !item._id) continue;
    const key = (item.link || item._id).toLowerCase();
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

function isInternshipTitle(title = '') {
  return /\bintern(ship)?\b|\btrainee\b|\bapprentice\b/i.test(title);
}

function isIndiaLocationText(text = '') {
  const lower = String(text || '').toLowerCase();
  return INDIA_TERMS.some((term) => lower.includes(term));
}

function isIndiaInternship(item = {}) {
  return isIndiaLocationText(item.location) || isIndiaLocationText(item.description);
}

async function fetchRapidApiInternships({ query, page = 1, limit = 20, remoteOnly = false }) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  assertProviderRateLimit('rapidapi');

  const q = encodeURIComponent(`${query || 'software'} internship in india`);
  const numPages = Math.max(1, page);
  const extraPages = Math.max(2, Math.min(6, Math.ceil(limit / 10)));
  const endpoint = `https://${RAPIDAPI_HOST}/search?query=${q}&page=${numPages}&num_pages=${extraPages}&date_posted=all&country=in`;

  const response = await fetchWithTimeout(endpoint, {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RapidAPI error (${response.status}): ${text.slice(0, 180)}`);
  }

  const payload = await response.json();
  const jobs = Array.isArray(payload?.data) ? payload.data : [];

  return jobs
    .map(normalizeRapidApiJob)
    .filter((item) => isInternshipTitle(item.title))
    .filter((item) => isIndiaInternship(item))
    .filter((item) => (remoteOnly ? item.type === 'remote' : true))
    .slice(0, Math.max(limit, 60));
}

async function fetchAdzunaInternships({ query, page = 1, limit = 20, remoteOnly = false }) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || 'in';
  if (!appId || !appKey) return [];

  assertProviderRateLimit('adzuna');

  const q = encodeURIComponent(`${query || 'software'} internship`);
  const where = encodeURIComponent(process.env.ADZUNA_WHERE || 'India');
  const endpoint = `https://api.adzuna.com/v1/api/jobs/${country}/search/${Math.max(1, page)}?app_id=${appId}&app_key=${appKey}&results_per_page=${limit}&what=${q}&where=${where}&content-type=application/json`;

  const response = await fetchWithTimeout(endpoint);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Adzuna error (${response.status}): ${text.slice(0, 180)}`);
  }

  const payload = await response.json();
  const jobs = Array.isArray(payload?.results) ? payload.results : [];

  return jobs
    .map(normalizeAdzunaJob)
    .filter((item) => isInternshipTitle(item.title))
    .filter((item) => isIndiaInternship(item))
    .filter((item) => (remoteOnly ? item.type === 'remote' : true))
    .slice(0, Math.max(limit, 60));
}

async function fetchRealInternships({ query, page = 1, limit = 20, remoteOnly = false }) {
  const normalizedQuery = String(query || 'software').trim().toLowerCase();
  const cacheKey = `${normalizedQuery}|${page}|${limit}|${remoteOnly ? 'r' : 'a'}`;
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
    return cached.data;
  }

  const providers = [
    { name: 'RapidAPI JSearch', run: () => withRetry(() => fetchRapidApiInternships({ query, page, limit, remoteOnly }), 'rapidapi', 2) },
    { name: 'Adzuna', run: () => withRetry(() => fetchAdzunaInternships({ query, page, limit, remoteOnly }), 'adzuna', 2) },
  ];

  const merged = [];
  for (const provider of providers) {
    try {
      const list = await provider.run();
      if (list.length > 0) merged.push(...list);
    } catch (error) {
      console.error(`${provider.name} failed:`, error.message || error);
    }
  }

  const deduped = dedupeByApplyLink(merged).slice(0, Math.max(limit, 120));

  if (deduped.length === 0 && !process.env.RAPIDAPI_KEY && !(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY)) {
    const error = new Error('No live job provider configured. Set RAPIDAPI_KEY and/or ADZUNA_APP_ID + ADZUNA_APP_KEY in server/.env.');
    error.code = 'NO_PROVIDER_CONFIG';
    throw error;
  }

  queryCache.set(cacheKey, { timestamp: Date.now(), data: deduped });
  return deduped;
}

module.exports = {
  fetchRealInternships,
};
