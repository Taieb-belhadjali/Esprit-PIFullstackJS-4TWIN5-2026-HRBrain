/**
 * Script: setup-dataset.ts
 * Full pipeline to run after importing employees_updated.csv into MongoDB.
 *
 * Steps:
 *   1. Fix CV paths in DB  (absolute → relative DataSets/uploads/)
 *   2. Clean skill names in DB + CV files (remove noise suffixes)
 *   3. Fix broken activity skill references
 *   4. Fix CSV file paths for future imports
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/setup-dataset.ts
 */
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

const MONGO_URI =
  'mongodb+srv://taiebaminebelhadjali_db_user:Complexatom88@cluster0.wczwpwn.mongodb.net/HRBrain_db';

const NOISE_SUFFIXES = new Set([
  'ROBUST', 'BUSINESS', 'HANDS-ON', 'CONSULTANT', 'TACTICAL', 'OPERATIONAL',
  'PRODUCTION', 'ENTERPRISE', 'EFFICIENT', 'THEORETICAL', 'SPECIALIST',
  'COLLABORATION', 'MONITORING', 'CERTIFIED', 'MAINTAINABLE', 'SCALABLE',
  'COMPREHENSIVE', 'OPTIMIZED', 'SECURE', 'PROFESSIONAL', 'FUNDAMENTALS',
  'ESSENTIALS', 'MANAGEMENT', 'PLANNING', 'ARCHITECT', 'MASTER', 'APPLIED',
  'TECHNICAL', 'LEADERSHIP', 'DESIGN', 'DEVELOPMENT', 'IMPLEMENTATION',
  'FOUNDATION', 'INTENSIVE', 'DEBUGGING', 'ADVANCED', 'BASIC', 'CORE',
  'SENIOR', 'JUNIOR', 'INTERMEDIATE', 'BEGINNER', 'PRACTICAL',
  'WORKSHOP', 'TRAINING', 'COURSE', 'BOOTCAMP', 'OVERVIEW', 'INTRODUCTION',
  'REAL-WORLD', 'COMPLETE', 'ARCHITECTURE', 'OPERATIONS', 'ANALYTICAL',
  'INTERACTIVE', 'MODERN', 'FULLSTACK', 'FULL-STACK',
]);

function cleanName(name: string): string {
  const parts = name.trim().split(/\s+/);
  while (parts.length > 1 && NOISE_SUFFIXES.has(parts[parts.length - 1].toUpperCase())) {
    parts.pop();
  }
  return parts.join(' ');
}

// ── Step 1: Fix CV paths in DB ────────────────────────────────────────────
async function fixCvPaths(db: mongoose.mongo.Db) {
  console.log('\n[1/4] Fixing CV paths in DB…');
  const datasetUploads = path.join(process.cwd(), 'DataSets', 'uploads');
  const employees = await db.collection('users')
    .find({ cv: { $exists: true, $nin: [null, ''] } }, { projection: { _id: 1, cv: 1 } })
    .toArray();

  const bulkOps: any[] = [];
  for (const emp of employees) {
    const filename = path.basename((emp.cv as string).replace(/\\/g, '/'));
    const newPath = path.join(datasetUploads, filename);
    if (emp.cv !== newPath) {
      bulkOps.push({ updateOne: { filter: { _id: emp._id }, update: { $set: { cv: newPath } } } });
    }
  }

  if (bulkOps.length === 0) { console.log('  Already up to date.'); return; }

  for (let i = 0; i < bulkOps.length; i += 500) {
    await db.collection('users').bulkWrite(bulkOps.slice(i, i + 500), { ordered: false });
  }
  console.log(`  Fixed ${bulkOps.length} CV paths.`);
}

// ── Step 2: Clean skill names in DB + CV files ────────────────────────────
async function cleanSkills(db: mongoose.mongo.Db) {
  console.log('\n[2/4] Cleaning skill names in DB…');
  const skills = await db.collection('skills').find({}, { projection: { _id: 1, name: 1 } }).toArray();
  const toRename = skills
    .map((s) => ({ id: s._id, from: s.name as string, to: cleanName(s.name as string) }))
    .filter((s) => s.from !== s.to);

  if (toRename.length === 0) { console.log('  Already clean.'); }
  else {
    for (let i = 0; i < toRename.length; i += 500) {
      await db.collection('skills').bulkWrite(
        toRename.slice(i, i + 500).map(({ id, to }) => ({
          updateOne: { filter: { _id: id }, update: { $set: { name: to } } },
        })),
        { ordered: false },
      );
    }
    console.log(`  Renamed ${toRename.length} skills.`);
  }

  console.log('\n[2/4] Cleaning CV files…');
  const uploadsDir = path.join(process.cwd(), 'DataSets', 'uploads');
  if (!fs.existsSync(uploadsDir)) { console.log('  Uploads dir not found, skipping.'); return; }

  const files = fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.txt'));
  let filesChanged = 0, linesChanged = 0;
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    let changed = false;
    const newLines = lines.map((line) => {
      const match = line.trim().match(/^([A-Za-z0-9\s#\+\.\-\_@]+):([A-Za-z]+)((?::[^\s]*)?)$/i);
      if (!match) return line;
      const cleaned = cleanName(match[1].trim());
      if (cleaned === match[1].trim()) return line;
      changed = true; linesChanged++;
      return `${cleaned}:${match[2]}${match[3]}`;
    });
    if (changed) { fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8'); filesChanged++; }
  }
  console.log(`  ${filesChanged} files updated, ${linesChanged} lines cleaned.`);
}

// ── Step 3: Fix broken activity skill references ──────────────────────────
async function fixActivitySkills(db: mongoose.mongo.Db) {
  console.log('\n[3/4] Checking activity skill references…');
  const allSkills = await db.collection('skills').find({}, { projection: { _id: 1 } }).toArray();
  const validIds = new Set(allSkills.map((s) => String(s._id)));

  const activities = await db.collection('activities').find({}).toArray();
  const bulkOps: any[] = [];
  let removedRefs = 0;

  for (const act of activities) {
    const required: any[] = act.requiredSkills ?? [];
    const valid = required.filter((rs) => validIds.has(String(rs.skillId)));
    if (valid.length < required.length) {
      removedRefs += required.length - valid.length;
      bulkOps.push({ updateOne: { filter: { _id: act._id }, update: { $set: { requiredSkills: valid } } } });
    }
  }

  if (bulkOps.length === 0) { console.log('  All references are valid.'); return; }
  await db.collection('activities').bulkWrite(bulkOps, { ordered: false });
  console.log(`  Fixed ${bulkOps.length} activities, removed ${removedRefs} broken refs.`);
}

// ── Step 4: Fix CSV file paths ────────────────────────────────────────────
function fixCsvPaths() {
  console.log('\n[4/4] Fixing CSV paths…');
  const csvPath = path.join(process.cwd(), 'DataSets', 'employees_updated.csv');
  if (!fs.existsSync(csvPath)) { console.log('  CSV not found, skipping.'); return; }

  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');
  let fixed = 0;
  const newLines = lines.map((line, i) => {
    if (i === 0 || !line.trim()) return line;
    const cols = line.split(',');
    if (cols.length < 5 || cols[4].startsWith('DataSets/')) return line;
    const filename = path.basename(cols[4].replace(/\\/g, '/'));
    cols[4] = `DataSets/uploads/${filename}`;
    fixed++;
    return cols.join(',');
  });
  fs.writeFileSync(csvPath, newLines.join('\n'), 'utf-8');
  console.log(`  ${fixed} paths updated in CSV.`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('=== Dataset Setup Pipeline ===');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 120000 });
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  await fixCvPaths(db);
  await cleanSkills(db);
  await fixActivitySkills(db);

  await mongoose.disconnect();

  fixCsvPaths();

  console.log('\n=== Done. Restart the backend to apply changes. ===');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
