const LIVE_CACHE_TTL_MS = 30 * 60 * 1000;

const internshipsById = new Map();

function upsertInternships(items = []) {
  const now = Date.now();
  for (const item of items) {
    if (!item || !item._id) continue;
    internshipsById.set(item._id, {
      data: item,
      updatedAtMs: now,
    });
  }
}

function getInternshipById(id) {
  if (!id) return null;
  const entry = internshipsById.get(id);
  if (!entry) return null;

  const isExpired = Date.now() - entry.updatedAtMs > LIVE_CACHE_TTL_MS;
  if (isExpired) {
    internshipsById.delete(id);
    return null;
  }

  return entry.data;
}

function getAllCachedInternships() {
  const now = Date.now();
  const result = [];

  for (const [key, entry] of internshipsById.entries()) {
    if (now - entry.updatedAtMs > LIVE_CACHE_TTL_MS) {
      internshipsById.delete(key);
      continue;
    }
    result.push(entry.data);
  }

  return result;
}

module.exports = {
  upsertInternships,
  getInternshipById,
  getAllCachedInternships,
};
