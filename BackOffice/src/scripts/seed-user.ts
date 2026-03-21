import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGO_URI =
  'mongodb+srv://taiebaminebelhadjali_db_user:1uK23IXEAS7NMcZs@cluster0.wczwpwn.mongodb.net/HRBrain_db';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  const email = 'admin.hr@hrbrain.com';
  const existing = await db.collection('users').findOne({ email });

  if (existing) {
    console.log('User already exists:', email);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash('Admin123', 10);

  await db.collection('users').insertOne({
    name: 'Admin HR',
    email,
    password: hashed,
    role: 'HR',
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('User created successfully!');
  console.log('Email   :', email);
  console.log('Password: Admin123');
  console.log('Role    : HR');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
