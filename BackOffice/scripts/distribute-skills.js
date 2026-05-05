/**
 * distribute-skills.js
 *
 * Distributes all skills evenly across all existing departments (round-robin).
 * Skills that already have a departmentId are reassigned too, for a fresh even distribution.
 *
 * Run (inside the backend container or locally with Node ≥ 16):
 *   node BackOffice/scripts/distribute-skills.js
 *
 * From Docker:
 *   docker exec -it hrbrain-backend node scripts/distribute-skills.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://taiebaminebelhadjali_db_user:Complexatom88@cluster0.wczwpwn.mongodb.net/HRBrain_db';

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB.');

    const db = client.db();

    const departments = await db.collection('departments').find({}).toArray();
    const skills      = await db.collection('skills').find({}).toArray();

    if (departments.length === 0) {
      console.error('No departments found — create at least one department first.');
      process.exit(1);
    }

    if (skills.length === 0) {
      console.log('No skills found — nothing to distribute.');
      return;
    }

    console.log(`Departments (${departments.length}): ${departments.map(d => d.name).join(', ')}`);
    console.log(`Skills to distribute: ${skills.length}`);

    // Round-robin: skill[i] → departments[i % n]
    const ops = skills.map((skill, i) => ({
      updateOne: {
        filter: { _id: skill._id },
        update: { $set: { departmentId: departments[i % departments.length]._id } },
      },
    }));

    const result = await db.collection('skills').bulkWrite(ops);
    console.log(`\nDone — ${result.modifiedCount} skills updated.`);

    // Summary per department
    const perDept = {};
    departments.forEach(d => { perDept[String(d._id)] = { name: d.name, count: 0 }; });
    skills.forEach((_, i) => {
      const key = String(departments[i % departments.length]._id);
      perDept[key].count++;
    });
    console.log('\nDistribution:');
    Object.values(perDept).forEach(d => console.log(`  ${d.name}: ${d.count} skill(s)`));
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
