/**
 * Script: enrich-dataset.ts
 * Regenerates CV files with real DB skill names and varied levels (LOW/MEDIUM/HIGH/EXPERT).
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/enrich-dataset.ts
 */
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

const MONGO_URI =
  'mongodb+srv://taiebaminebelhadjali_db_user:1uK23IXEAS7NMcZs@cluster0.wczwpwn.mongodb.net/HRBrain_db';

// Realistic level distribution: 60% LOW, 25% MEDIUM, 12% HIGH, 3% EXPERT
const LEVELS = ['LOW', 'LOW', 'LOW', 'LOW', 'LOW', 'LOW',
                'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM',
                'HIGH', 'HIGH', 'HIGH',
                'EXPERT'];

function randomLevel(): string {
  return LEVELS[Math.floor(Math.random() * LEVELS.length)];
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Skills "core" qui apparaissent souvent dans les activités — garantir leur présence dans ~40% des CVs
const CORE_SKILLS = [
  'NODE.JS', 'TYPESCRIPT', 'PYTHON', 'REACT', 'POSTGRESQL', 'MONGODB',
  'DOCKER', 'KUBERNETES', 'GIT', 'JAVASCRIPT', 'JAVA', 'SPRING BOOT',
  'DJANGO', 'FASTAPI', 'MYSQL', 'REST API', 'GRAPHQL API', 'REDIS',
  'ELASTICSEARCH', 'MICROSERVICES',
];

async function run() {
  console.log('=== Enrich Dataset ===');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  // Load all valid skill names from DB
  const skills = await db.collection('skills')
    .find({}, { projection: { name: 1 } })
    .toArray();

  // Deduplicate by uppercase name
  const skillMap = new Map<string, string>();
  for (const s of skills) {
    const key = (s.name as string).toUpperCase();
    if (!skillMap.has(key)) skillMap.set(key, s.name as string);
  }
  const skillNames = Array.from(skillMap.values());
  console.log(`Loaded ${skillNames.length} unique skills from DB`);

  // Load all employees with CV paths
  const employees = await db.collection('users')
    .find({ role: 'EMPLOYEE' })
    .project({ _id: 1, name: 1, cv: 1 })
    .toArray();

  console.log(`Found ${employees.length} total employees`);  if (employees.length > 0) {
    console.log(`Sample CV path: ${employees[0].cv}`);
  }
  const uploadsDir = path.join(process.cwd(), 'DataSets', 'uploads');
  let updated = 0;
  let skipped = 0;

  for (const emp of employees) {
    let targetPath: string;

    if (emp.cv && (emp.cv as string).trim()) {
      const cvPath = (emp.cv as string).startsWith('/')
        ? emp.cv as string
        : path.resolve(process.cwd(), emp.cv as string);
      targetPath = cvPath.replace(/\.pdf$/i, '.txt');
    } else {
      // No CV path — create one in uploads dir based on employee ID
      targetPath = path.join(uploadsDir, `${emp._id}.txt`);
    }

    // Pick 5-12 random skills for this employee
    const count = 5 + Math.floor(Math.random() * 8);

    // 40% chance to include 1-2 core skills with varied levels
    const coreToAdd: string[] = [];
    if (Math.random() < 0.4) {
      const validCores = CORE_SKILLS.filter((c) => skillMap.has(c));
      const numCore = 1 + Math.floor(Math.random() * 2);
      coreToAdd.push(...shuffle([...validCores]).slice(0, numCore));
    }

    const remaining = count - coreToAdd.length;
    const otherSkills = shuffle([...skillNames].filter((n) => !coreToAdd.includes(n.toUpperCase()))).slice(0, remaining);
    const chosen = [...coreToAdd.map((c) => skillMap.get(c) ?? c), ...otherSkills];

    const lines = chosen.map((name) => `${name}:${randomLevel()}`);

    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(targetPath, lines.join('\n') + '\n', 'utf-8');

      // Update DB path to .txt if it was .pdf or missing
      if (targetPath !== (emp.cv as string)) {
        await db.collection('users').updateOne(
          { _id: emp._id },
          { $set: { cv: targetPath } },
        );
      }
      updated++;
    } catch (e: any) {
      console.error(`Failed for ${emp.name}: ${e.message}`);
      skipped++;
    }
  }

  console.log(`Updated: ${updated} CVs, Skipped (missing file): ${skipped}`);
  await mongoose.disconnect();
  console.log('Done. Restart the backend to apply changes.');
}

run().catch((err) => { console.error(err); process.exit(1); });
