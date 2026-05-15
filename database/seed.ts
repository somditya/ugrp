import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-hashed password (bcrypt, 10 rounds): "password123"
const PASSWORD_HASH = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.';

async function main() {
  console.log('🌱 Seeding database...');

  // -------------------------------------------------------------------------
  // 1. Departments (5) - as per F02 spec
  // -------------------------------------------------------------------------
  console.log('Creating departments...');

  const deptCS = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { name: 'Computer Science & Engineering', code: 'CSE' },
  });

  const deptMECH = await prisma.department.upsert({
    where: { code: 'MECH' },
    update: {},
    create: { name: 'Mechanical Engineering', code: 'MECH' },
  });

  const deptADM = await prisma.department.upsert({
    where: { code: 'ADM' },
    update: {},
    create: { name: 'Administration', code: 'ADM' },
  });

  const deptLIB = await prisma.department.upsert({
    where: { code: 'LIB' },
    update: {},
    create: { name: 'Library', code: 'LIB' },
  });

  const deptEXAM = await prisma.department.upsert({
    where: { code: 'EXAM' },
    update: {},
    create: { name: 'Examination Cell', code: 'EXAM' },
  });

  // -------------------------------------------------------------------------
  // 2. Users — Admin (1)
  // -------------------------------------------------------------------------
  console.log('Creating admin user...');

  await prisma.user.upsert({
    where: { email: 'admin@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-ADMIN-0001',
      role: 'ADMIN',
      name: 'System Administrator',
      departmentId: deptCS.id,
      email: 'admin@ugrp.dev',
      mobile: '+91-99999-0100',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // -------------------------------------------------------------------------
  // 3. Users — Committee (3)
  // -------------------------------------------------------------------------
  console.log('Creating committee members...');

  const committee1 = await prisma.user.upsert({
    where: { email: 'chairman@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-COM-0001',
      role: 'COMMITTEE',
      name: 'Dr. Ramesh Gupta',
      departmentId: deptCS.id,
      email: 'chairman@ugrp.dev',
      mobile: '+91-99999-0201',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const committee2 = await prisma.user.upsert({
    where: { email: 'member1@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-COM-0002',
      role: 'COMMITTEE',
      name: 'Prof. Ananya Mehta',
      departmentId: deptEXAM.id,
      email: 'member1@ugrp.dev',
      mobile: '+91-99999-0202',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const committee3 = await prisma.user.upsert({
    where: { email: 'member2@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-COM-0003',
      role: 'COMMITTEE',
      name: 'Dr. Suresh Kumar',
      departmentId: deptLIB.id,
      email: 'member2@ugrp.dev',
      mobile: '+91-99999-0203',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // -------------------------------------------------------------------------
  // 4. Users — Faculty / HOD (3)
  // -------------------------------------------------------------------------
  console.log('Creating faculty users...');

  await prisma.user.upsert({
    where: { email: 'faculty1@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-FAC-0001',
      role: 'TEACHING',
      name: 'Dr. Priya Sharma',
      departmentId: deptCS.id,
      email: 'faculty1@ugrp.dev',
      mobile: '+91-99999-0301',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const hodCS = await prisma.user.upsert({
    where: { email: 'hod.cse@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-HOD-0001',
      role: 'HOD',
      name: 'Prof. Arun Nair',
      departmentId: deptCS.id,
      email: 'hod.cse@ugrp.dev',
      mobile: '+91-99999-0401',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const hodMECH = await prisma.user.upsert({
    where: { email: 'hod.mech@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-HOD-0002',
      role: 'HOD',
      departmentId: deptMECH.id,
      name: 'Prof. Deepa Rani',
      email: 'hod.mech@ugrp.dev',
      mobile: '+91-99999-0402',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // Set HOD references on departments
  await prisma.department.update({ where: { id: deptCS.id }, data: { hodId: hodCS.id } });
  await prisma.department.update({ where: { id: deptMECH.id }, data: { hodId: hodMECH.id } });

  // -------------------------------------------------------------------------
  // 5. Users — Students (5)
  // -------------------------------------------------------------------------
  console.log('Creating student users...');

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0001',
      role: 'STUDENT',
      name: 'Amit Patel',
      departmentId: deptCS.id,
      email: 'student1@ugrp.dev',
      mobile: '+91-99999-1001',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0002',
      role: 'STUDENT',
      name: 'Sneha Reddy',
      departmentId: deptMECH.id,
      email: 'student2@ugrp.dev',
      mobile: '+91-99999-1002',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'student3@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0003',
      role: 'STUDENT',
      name: 'Rohit Singh',
      departmentId: deptADM.id,
      email: 'student3@ugrp.dev',
      mobile: '+91-99999-1003',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const student4 = await prisma.user.upsert({
    where: { email: 'student4@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0004',
      role: 'STUDENT',
      name: 'Meera Joshi',
      departmentId: deptLIB.id,
      email: 'student4@ugrp.dev',
      mobile: '+91-99999-1004',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const student5 = await prisma.user.upsert({
    where: { email: 'student5@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0005',
      role: 'STUDENT',
      name: 'Karan Verma',
      departmentId: deptEXAM.id,
      email: 'student5@ugrp.dev',
      mobile: '+91-99999-1005',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // -------------------------------------------------------------------------
  // 6. Grievance Categories (17) as per F02 spec with correct SLA values
  // -------------------------------------------------------------------------
  console.log('Creating grievance categories (SLA-mapped)...');

  // Ragging (1 day, priority critical)
  const catRagging = await prisma.grievanceCategory.upsert({
    where: { slug: 'ragging' },
    update: {},
    create: {
      name: 'Ragging / Anti-Ragging',
      slug: 'ragging',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 1,
      isPriorityCritical: true,
    },
  });

  // Gender Issue / POSH (1 day, priority critical)
  const catGender = await prisma.grievanceCategory.upsert({
    where: { slug: 'gender-posh' },
    update: {},
    create: {
      name: 'Gender Issue / POSH',
      slug: 'gender-posh',
      stakeholderType: 'ALL',
      slaWorkingDays: 1,
      isPriorityCritical: true,
    },
  });

  // Student categories (20 days each)
  const catStudentAcademic = await prisma.grievanceCategory.upsert({
    where: { slug: 'student-academic' },
    update: {},
    create: {
      name: 'Student Academic',
      slug: 'student-academic',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  const catStudentFinancial = await prisma.grievanceCategory.upsert({
    where: { slug: 'student-financial' },
    update: {},
    create: {
      name: 'Student Financial',
      slug: 'student-financial',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  const catStudentInfrastructure = await prisma.grievanceCategory.upsert({
    where: { slug: 'student-infrastructure' },
    update: {},
    create: {
      name: 'Student Infrastructure',
      slug: 'student-infrastructure',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  const catStudentAdministrative = await prisma.grievanceCategory.upsert({
    where: { slug: 'student-administrative' },
    update: {},
    create: {
      name: 'Student Administrative',
      slug: 'student-administrative',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  const catStudentPlacements = await prisma.grievanceCategory.upsert({
    where: { slug: 'student-placements' },
    update: {},
    create: {
      name: 'Student Placements',
      slug: 'student-placements',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  const catStudentMentalHealth = await prisma.grievanceCategory.upsert({
    where: { slug: 'student-mental-health' },
    update: {},
    create: {
      name: 'Student Mental Health',
      slug: 'student-mental-health',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  // Teaching Faculty categories (15 days each)
  const catFacultyService = await prisma.grievanceCategory.upsert({
    where: { slug: 'faculty-service' },
    update: {},
    create: {
      name: 'Faculty Service Matters',
      slug: 'faculty-service',
      stakeholderType: 'TEACHING',
      slaWorkingDays: 15,
      isPriorityCritical: false,
    },
  });

  const catFacultyPay = await prisma.grievanceCategory.upsert({
    where: { slug: 'faculty-pay' },
    update: {},
    create: {
      name: 'Faculty Pay & Allowances',
      slug: 'faculty-pay',
      stakeholderType: 'TEACHING',
      slaWorkingDays: 15,
      isPriorityCritical: false,
    },
  });

  const catFacultyWorking = await prisma.grievanceCategory.upsert({
    where: { slug: 'faculty-working' },
    update: {},
    create: {
      name: 'Faculty Working Conditions',
      slug: 'faculty-working',
      stakeholderType: 'TEACHING',
      slaWorkingDays: 15,
      isPriorityCritical: false,
    },
  });

  const catFacultyContractual = await prisma.grievanceCategory.upsert({
    where: { slug: 'faculty-contractual' },
    update: {},
    create: {
      name: 'Faculty Contractual',
      slug: 'faculty-contractual',
      stakeholderType: 'TEACHING',
      slaWorkingDays: 15,
      isPriorityCritical: false,
    },
  });

  // Non-Teaching Staff categories (15 days each)
  const catStaffService = await prisma.grievanceCategory.upsert({
    where: { slug: 'staff-service' },
    update: {},
    create: {
      name: 'Staff Service Matters',
      slug: 'staff-service',
      stakeholderType: 'NON_TEACHING',
      slaWorkingDays: 15,
      isPriorityCritical: false,
    },
  });

  const catStaffPay = await prisma.grievanceCategory.upsert({
    where: { slug: 'staff-pay' },
    update: {},
    create: {
      name: 'Staff Pay & Benefits',
      slug: 'staff-pay',
      stakeholderType: 'NON_TEACHING',
      slaWorkingDays: 15,
      isPriorityCritical: false,
    },
  });

  const catStaffWorking = await prisma.grievanceCategory.upsert({
    where: { slug: 'staff-working' },
    update: {},
    create: {
      name: 'Staff Working Conditions',
      slug: 'staff-working',
      stakeholderType: 'NON_TEACHING',
      slaWorkingDays: 15,
      isPriorityCritical: false,
    },
  });

  // HEI categories (20 days each)
  const catHEIAffiliation = await prisma.grievanceCategory.upsert({
    where: { slug: 'hei-affiliation' },
    update: {},
    create: {
      name: 'HEI Affiliation',
      slug: 'hei-affiliation',
      stakeholderType: 'HEI',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  const catHEIGrants = await prisma.grievanceCategory.upsert({
    where: { slug: 'hei-grants' },
    update: {},
    create: {
      name: 'HEI Grant Disbursement',
      slug: 'hei-grants',
      stakeholderType: 'HEI',
      slaWorkingDays: 20,
      isPriorityCritical: false,
    },
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('👤 1 Admin:           admin@ugrp.dev');
  console.log('👥 3 Committee:       chairman@ugrp.dev, member1@ugrp.dev, member2@ugrp.dev');
  console.log('🏫 3 Faculty/HOD:    faculty1@ugrp.dev, hod.cse@ugrp.dev, hod.mech@ugrp.dev');
  console.log('🎓 5 Students:       student1–5@ugrp.dev');
  console.log('📂 5 Departments:    CSE, MECH, ADM, LIB, EXAM');
  console.log('🏷️  17 Categories:    Ragging(1d)*, Gender(1d)*, Student(20d)x6, Faculty(15d)x4, Staff(15d)x3, HEI(20d)x2');
  console.log('   * = Priority Critical');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });