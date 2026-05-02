import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGO_URI =
  'mongodb+srv://taiebaminebelhadjali_db_user:Complexatom88@cluster0.wczwpwn.mongodb.net/HRBrain_db';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  // Create SUPERADMIN
  const superAdminEmail = 'superadmin@hrbrain.com';
  const existingSuperAdmin = await db.collection('users').findOne({ email: superAdminEmail });

  if (!existingSuperAdmin) {
    const hashed = await bcrypt.hash('SuperAdmin123!', 10);
    await db.collection('users').insertOne({
      name: 'Super Admin',
      email: superAdminEmail,
      password: hashed,
      role: 'SUPERADMIN',
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('SUPERADMIN created:', superAdminEmail);
  } else {
    console.log('SUPERADMIN already exists:', superAdminEmail);
  }

  // Create HR Admin
  const hrEmail = 'admin.hr@hrbrain.com';
  const existingHR = await db.collection('users').findOne({ email: hrEmail });

  if (!existingHR) {
    const hashed = await bcrypt.hash('Admin123', 10);
    await db.collection('users').insertOne({
      name: 'Admin HR',
      email: hrEmail,
      password: hashed,
      role: 'HR',
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('HR Admin created:', hrEmail);
  } else {
    console.log('HR Admin already exists:', hrEmail);
  }

  console.log('\nCredentials:');
  console.log('SUPERADMIN — Email:', superAdminEmail, '| Password: SuperAdmin123!');
  console.log('HR Admin   — Email:', hrEmail, '| Password: Admin123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
