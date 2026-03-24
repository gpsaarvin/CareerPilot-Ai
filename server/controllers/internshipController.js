const { fetchRealInternships } = require('../services/jobProviders');
const { upsertInternships, getInternshipById, getAllCachedInternships } = require('../data/liveInternshipStore');
const { OpenAI } = require('openai');

const DEFAULT_LIMIT = 24;
const DEFAULT_QUERY = 'software engineer';
const DEFAULT_FEED_TARGET = Number.parseInt(process.env.DEFAULT_FEED_TARGET || '60', 10);
const DEFAULT_FEED_CACHE_TTL_MS = Number.parseInt(process.env.DEFAULT_FEED_CACHE_TTL_MS || '300000', 10);
const companyAliasCache = new Map();
const companySearchResponseCache = new Map();
const COMPANY_SEARCH_CACHE_TTL_MS = Number.parseInt(process.env.COMPANY_SEARCH_CACHE_TTL_MS || '300000', 10);
const defaultFeedCache = new Map();

function safeJsonParse(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;

  const clean = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch (error) {
    return fallback;
  }
}

async function getCompanyAliases(company) {
  const normalized = String(company || '').trim().toLowerCase();
  if (!normalized) return [];

  if (companyAliasCache.has(normalized)) {
    return companyAliasCache.get(normalized);
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const fallbackAliases = [normalized];
    companyAliasCache.set(normalized, fallbackAliases);
    return fallbackAliases;
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
    });

    const model = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'deepseek/deepseek-chat';
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Return only JSON array of likely alias names for a company used in job listings. Keep concise lowercase terms. Example: ["google","google india","alphabet"].',
        },
        {
          role: 'user',
          content: `Company: ${company}`,
        },
      ],
    });

    const parsed = safeJsonParse(completion?.choices?.[0]?.message?.content || '[]', []);
    const aliases = Array.from(new Set([normalized, ...(Array.isArray(parsed) ? parsed : [])]
      .map((item) => String(item || '').toLowerCase().trim())
      .filter(Boolean)));

    companyAliasCache.set(normalized, aliases);
    return aliases;
  } catch (error) {
    const fallbackAliases = [normalized];
    companyAliasCache.set(normalized, fallbackAliases);
    return fallbackAliases;
  }
}

function heuristicCompanyMatch(items, aliases) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!Array.isArray(aliases) || aliases.length === 0) return items;

  return items.filter((item) => {
    const haystack = [item.company, item.title, item.description, item.link]
      .join(' ')
      .toLowerCase();
    return aliases.some((alias) => haystack.includes(alias));
  });
}

async function aiRefineCompanyMatches(company, aliases, items) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return heuristicCompanyMatch(items, aliases);

  const candidates = heuristicCompanyMatch(items, aliases);
  if (candidates.length <= 2) return candidates;

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
    });
    const model = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'deepseek/deepseek-chat';

    const compact = candidates.slice(0, 70).map((item) => ({
      id: item._id,
      title: item.title,
      company: item.company,
      location: item.location,
      description: String(item.description || '').slice(0, 160),
    }));

    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: 'Return only JSON object: {"selectedIds": ["..."]}. Select internships genuinely related to the requested company name or its subsidiaries/official teams.',
        },
        {
          role: 'user',
          content: `Target company: ${company}\nAliases: ${aliases.join(', ')}\nCandidates: ${JSON.stringify(compact)}`,
        },
      ],
    });

    const parsed = safeJsonParse(completion?.choices?.[0]?.message?.content || '{}', {});
    const selectedIds = Array.isArray(parsed?.selectedIds) ? parsed.selectedIds : [];
    if (selectedIds.length === 0) return candidates;

    const selectedSet = new Set(selectedIds.map((id) => String(id)));
    const refined = candidates.filter((item) => selectedSet.has(String(item._id)));
    return refined.length > 0 ? refined : candidates;
  } catch (error) {
    return candidates;
  }
}

function normalizeStipendValue(stipend = '') {
  const numeric = String(stipend).replace(/[^0-9]/g, '');
  return numeric ? Number.parseInt(numeric, 10) : 0;
}

function applyLocalFilters(items, {
  search,
  skills,
  location,
  type,
  paid,
  min_stipend,
  max_stipend,
  source,
}) {
  let filtered = [...items];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((item) =>
      [item.title, item.company, item.description, item.location].join(' ').toLowerCase().includes(q)
    );
  }

  if (skills) {
    const terms = String(skills).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (terms.length > 0) {
      filtered = filtered.filter((item) =>
        terms.some((term) => (item.skills_required || []).some((skill) => skill.toLowerCase().includes(term)))
      );
    }
  }

  if (location) {
    const target = String(location).toLowerCase();
    filtered = filtered.filter((item) => item.location.toLowerCase().includes(target));
  }

  if (type) {
    const target = String(type).toLowerCase();
    filtered = filtered.filter((item) => item.type.toLowerCase() === target);
  }

  if (source) {
    const target = String(source).toLowerCase();
    filtered = filtered.filter((item) => item.source.toLowerCase().includes(target));
  }

  if (paid === 'paid') {
    filtered = filtered.filter((item) => item.isPaid !== false);
  }
  if (paid === 'unpaid') {
    filtered = filtered.filter((item) => item.isPaid === false);
  }

  if (min_stipend || max_stipend) {
    const min = min_stipend ? Number.parseInt(min_stipend, 10) : 0;
    const max = max_stipend ? Number.parseInt(max_stipend, 10) : Number.MAX_SAFE_INTEGER;
    filtered = filtered.filter((item) => {
      const stipend = normalizeStipendValue(item.stipend);
      return stipend >= min && stipend <= max;
    });
  }

  return filtered;
}

function sortInternships(items, sort) {
  if (!sort) return [...items];

  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const sorted = [...items].sort((a, b) => {
    if (field === 'stipend') {
      return normalizeStipendValue(a.stipend) - normalizeStipendValue(b.stipend);
    }

    const av = a[field] || '';
    const bv = b[field] || '';
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv);
    return 0;
  });

  return desc ? sorted.reverse() : sorted;
}

function dedupeInternships(items = []) {
  const map = new Map();
  for (const item of items) {
    if (!item?._id) continue;
    const key = String(item.link || item._id).toLowerCase();
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

function hasActiveFilters({ skills, location, type, paid, min_stipend, max_stipend, source }) {
  return Boolean(
    skills ||
    location ||
    type ||
    paid ||
    min_stipend ||
    max_stipend ||
    source
  );
}

async function buildDefaultInternshipFeed({ remoteOnly, minimumTarget }) {
  const primaryQueries = [
    'software engineering internship india',
    'frontend developer internship india',
    'backend developer internship india',
    'data analyst internship india',
    'machine learning internship india',
    'full stack internship india',
  ];

  const perQueryLimit = Math.max(35, Math.ceil(minimumTarget / primaryQueries.length) + 10);

  const primaryResults = await Promise.allSettled(
    primaryQueries.map((query) =>
      fetchRealInternships({
        query,
        page: 1,
        limit: perQueryLimit,
        remoteOnly,
      })
    )
  );

  let merged = dedupeInternships(
    primaryResults
      .filter((group) => group.status === 'fulfilled')
      .flatMap((group) => group.value || [])
  );

  if (merged.length < minimumTarget) {
    const fallbackResults = await Promise.allSettled(
      [
        'internship india',
        'software internship',
        'engineering internship',
      ].map((query) =>
        fetchRealInternships({
          query,
          page: 1,
          limit: Math.max(45, minimumTarget),
          remoteOnly,
        })
      )
    );

    merged = dedupeInternships([
      ...merged,
      ...fallbackResults
        .filter((group) => group.status === 'fulfilled')
        .flatMap((group) => group.value || []),
    ]);
  }

  return merged;
}

async function getInternships(req, res) {
  try {
    const {
      search,
      skills,
      location,
      type,
      paid,
      min_stipend,
      max_stipend,
      source,
      page = 1,
      limit = DEFAULT_LIMIT,
      sort = '-createdAt',
    } = req.query;

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Number.parseInt(limit, 10) || DEFAULT_LIMIT);
    const remoteOnly = type === 'remote';
    const providerFetchLimit = Math.max(pageLimit * 8, 160);
    const searchText = String(search || '').trim();
    const filtersApplied = hasActiveFilters({ skills, location, type, paid, min_stipend, max_stipend, source });

    let liveData = [];

    // Empty-search feed should stay rich so users always see internships on initial load.
    if (!searchText && !filtersApplied) {
      const feedCacheKey = remoteOnly ? 'default-remote' : 'default-all';
      const cachedFeed = defaultFeedCache.get(feedCacheKey);
      const isFresh = cachedFeed && Date.now() - cachedFeed.timestamp < DEFAULT_FEED_CACHE_TTL_MS;

      if (isFresh) {
        liveData = cachedFeed.items;
      } else {
        liveData = await buildDefaultInternshipFeed({
          remoteOnly,
          minimumTarget: Math.max(DEFAULT_FEED_TARGET, pageLimit * 2),
        });

        if (liveData.length > 0) {
          defaultFeedCache.set(feedCacheKey, {
            timestamp: Date.now(),
            items: liveData,
          });
        }
      }
    }

    if (liveData.length === 0) {
      liveData = await fetchRealInternships({
        query: searchText || DEFAULT_QUERY,
        page: 1,
        limit: providerFetchLimit,
        remoteOnly,
      });
    }

    if (liveData.length === 0) {
      liveData = getAllCachedInternships();
    }

    upsertInternships(liveData);

    const filtered = applyLocalFilters(liveData, {
      search,
      skills,
      location,
      type,
      paid,
      min_stipend,
      max_stipend,
      source,
    });

    const sorted = sortInternships(filtered, sort);
    const start = (pageNumber - 1) * pageLimit;
    const data = sorted.slice(start, start + pageLimit);

    return res.json({
      success: true,
      count: data.length,
      total: sorted.length,
      pages: Math.max(1, Math.ceil(sorted.length / pageLimit)),
      page: pageNumber,
      data,
      source: 'live',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getCompanyInternships(req, res) {
  try {
    const {
      company,
      page = 1,
      limit = DEFAULT_LIMIT,
      type,
      paid,
      location,
    } = req.query;

    if (!company || !String(company).trim()) {
      return res.status(400).json({ success: false, message: 'company query is required' });
    }

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Number.parseInt(limit, 10) || DEFAULT_LIMIT);

    const cacheKey = JSON.stringify({
      company: String(company).trim().toLowerCase(),
      page: pageNumber,
      limit: pageLimit,
      type: type || '',
      paid: paid || '',
      location: location || '',
    });
    const cached = companySearchResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < COMPANY_SEARCH_CACHE_TTL_MS) {
      return res.json(cached.payload);
    }

    const aliases = await getCompanyAliases(company);
    const providerFetchLimit = Math.max(pageLimit * 6, 120);
    const queryTerms = Array.from(new Set([String(company).trim(), ...aliases])).slice(0, 4);

    const fetchedGroups = await Promise.allSettled(
      queryTerms.map((term) =>
        fetchRealInternships({
          query: `${term} internship`,
          page: 1,
          limit: providerFetchLimit,
          remoteOnly: type === 'remote',
        })
      )
    );

    const fetched = fetchedGroups
      .filter((group) => group.status === 'fulfilled')
      .flatMap((group) => group.value || []);

    const merged = dedupeInternships(fetched);
    const companyMatched = await aiRefineCompanyMatches(company, aliases, merged);

    upsertInternships(companyMatched);

    const filtered = applyLocalFilters(companyMatched, {
      location,
      type,
      paid,
    });

    const start = (pageNumber - 1) * pageLimit;
    const data = filtered.slice(start, start + pageLimit);

    const payload = {
      success: true,
      count: data.length,
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / pageLimit)),
      page: pageNumber,
      company: String(company),
      data,
      source: 'company-live',
    };

    companySearchResponseCache.set(cacheKey, {
      timestamp: Date.now(),
      payload,
    });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getInternship(req, res) {
  const internship = getInternshipById(req.params.id);
  if (!internship) {
    return res.status(404).json({ success: false, message: 'Internship not found in live cache. Search again to refresh data.' });
  }
  return res.json({ success: true, data: internship });
}

async function trackClick(req, res) {
  const internship = getInternshipById(req.params.id);
  if (!internship) {
    return res.status(404).json({ success: false, message: 'Internship not found' });
  }

  internship.clicks = (internship.clicks || 0) + 1;
  internship.updatedAt = new Date().toISOString();
  upsertInternships([internship]);

  return res.json({ success: true, clicks: internship.clicks });
}

async function getFilterOptions(req, res) {
  const pool = getAllCachedInternships();
  const skills = [...new Set(pool.flatMap((item) => item.skills_required || []))].sort();
  const locations = [...new Set(pool.map((item) => item.location).filter(Boolean))].sort();
  const sources = [...new Set(pool.map((item) => item.source).filter(Boolean))].sort();
  const types = [...new Set(pool.map((item) => item.type).filter(Boolean))].sort();

  return res.json({
    success: true,
    data: {
      skills,
      locations,
      sources,
      types,
      paid: ['paid', 'unpaid'],
    },
  });
}

module.exports = {
  getInternships,
  getCompanyInternships,
  getInternship,
  trackClick,
  getFilterOptions,
};
