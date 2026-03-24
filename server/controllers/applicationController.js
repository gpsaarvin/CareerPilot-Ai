const { getFirestore } = require('../utils/firestore');
const { getInternshipById } = require('../data/liveInternshipStore');

const COLLECTION = process.env.FIRESTORE_SAVED_COLLECTION || 'savedInternships';

function assertUser(req, res) {
  const userId = req.user?._id;
  if (!userId || userId === 'demo-user') {
    res.status(401).json({ success: false, message: 'Please sign in with Google' });
    return null;
  }
  return userId;
}

function internshipSnapshotFromBody(body = {}, internshipFromCache = null) {
  if (body.internship_data && typeof body.internship_data === 'object') {
    return body.internship_data;
  }

  if (internshipFromCache) return internshipFromCache;

  return {
    _id: body.internship_id,
    title: 'Internship Opportunity',
    company: 'Unknown Company',
    location: 'Not specified',
    link: '',
    stipend: 'Not disclosed',
    type: 'onsite',
    source: 'Live Search',
  };
}

async function applyToInternship(req, res) {
  try {
    const userId = assertUser(req, res);
    if (!userId) return;

    const { internship_id, status = 'saved' } = req.body || {};
    if (!internship_id) {
      return res.status(400).json({ success: false, message: 'internship_id is required' });
    }

    const db = getFirestore();
    const internshipFromCache = getInternshipById(internship_id);
    const internship = internshipSnapshotFromBody(req.body, internshipFromCache);

    const existingQuery = await db
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('internship._id', '==', internship_id)
      .limit(1)
      .get();

    const now = new Date().toISOString();

    if (!existingQuery.empty) {
      const doc = existingQuery.docs[0];
      await doc.ref.update({
        status,
        internship,
        updatedAt: now,
      });

      const updated = await doc.ref.get();
      return res.json({ success: true, data: { _id: updated.id, ...updated.data() }, message: 'Status updated' });
    }

    const payload = {
      userId,
      internship,
      status,
      applied_date: now,
      saved_date: now,
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    const created = await db.collection(COLLECTION).add(payload);
    return res.status(201).json({ success: true, data: { _id: created.id, ...payload } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getApplications(req, res) {
  try {
    const userId = assertUser(req, res);
    if (!userId) return;

    const { status } = req.query;
    const db = getFirestore();

    let query = db.collection(COLLECTION).where('userId', '==', userId);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    const data = snapshot.docs
      .map((doc) => ({ _id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((item) => ({
        ...item,
        internship: item.internship || null,
      }));

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateApplication(req, res) {
  try {
    const userId = assertUser(req, res);
    if (!userId) return;

    const { status } = req.body || {};
    const docId = req.params.id;

    const db = getFirestore();
    const ref = db.collection(COLLECTION).doc(docId);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    await ref.update({
      status: status || data.status,
      updatedAt: new Date().toISOString(),
    });

    const updated = await ref.get();
    return res.json({ success: true, data: { _id: updated.id, ...updated.data() } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteApplication(req, res) {
  try {
    const userId = assertUser(req, res);
    if (!userId) return;

    const docId = req.params.id;
    const db = getFirestore();
    const ref = db.collection(COLLECTION).doc(docId);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    await ref.delete();
    return res.json({ success: true, message: 'Application removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  applyToInternship,
  getApplications,
  updateApplication,
  deleteApplication,
};
