import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-hashed password (bcrypt, 10 rounds): "password123"
const PASSWORD_HASH = '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.';

async function main() {
  console.log('🌱 Seeding database...');

  // -------------------------------------------------------------------------
  // 1. Departments (5)
  // -------------------------------------------------------------------------
  console.log('Creating departments...');

  const deptCS = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { name: 'Computer Science & Engineering', code: 'CSE' },
  });

  const deptECE = await prisma.department.upsert({
    where: { code: 'ECE' },
    update: {},
    create: { name: 'Electronics & Communication Engineering', code: 'ECE' },
  });

  const deptMECH = await prisma.department.upsert({
    where: { code: 'MECH' },
    update: {},
    create: { name: 'Mechanical Engineering', code: 'MECH' },
  });

  const deptHSS = await prisma.department.upsert({
    where: { code: 'HSS' },
    update: {},
    create: { name: 'Humanities & Social Sciences', code: 'HSS' },
  });

  const deptMBA = await prisma.department.upsert({
    where: { code: 'MBA' },
    update: {},
    create: { name: 'School of Management', code: 'MBA' },
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
      mobile: '+1-555-0100',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // -------------------------------------------------------------------------
  // 3. Users — Committee (3)
  // -------------------------------------------------------------------------
  console.log('Creating committee members...');

  await prisma.user.upsert({
    where: { email: 'chairman@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-COM-0001',
      role: 'COMMITTEE',
      name: 'Dr. Ramesh Gupta',
      departmentId: deptCS.id,
      email: 'chairman@ugrp.dev',
      mobile: '+1-555-0201',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'member1@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-COM-0002',
      role: 'COMMITTEE',
      name: 'Prof. Ananya Mehta',
      departmentId: deptHSS.id,
      email: 'member1@ugrp.dev',
      mobile: '+1-555-0202',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'member2@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-COM-0003',
      role: 'COMMITTEE',
      name: 'Dr. Suresh Kumar',
      departmentId: deptECE.id,
      email: 'member2@ugrp.dev',
      mobile: '+1-555-0203',
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
      mobile: '+1-555-0301',
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
      mobile: '+1-555-0401',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const hodECE = await prisma.user.upsert({
    where: { email: 'hod.ece@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-HOD-0002',
      role: 'HOD',
      departmentId: deptECE.id,
      name: 'Prof. Deepa Rani',
      email: 'hod.ece@ugrp.dev',
      mobile: '+1-555-0402',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // Set HOD references on departments
  await prisma.department.update({ where: { id: deptCS.id }, data: { hodId: hodCS.id } });
  await prisma.department.update({ where: { id: deptECE.id }, data: { hodId: hodECE.id } });

  // -------------------------------------------------------------------------
  // 5. Users — Students (5)
  // -------------------------------------------------------------------------
  console.log('Creating student users...');

  await prisma.user.upsert({
    where: { email: 'student1@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0001',
      role: 'STUDENT',
      name: 'Amit Patel',
      departmentId: deptCS.id,
      email: 'student1@ugrp.dev',
      mobile: '+1-555-1001',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student2@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0002',
      role: 'STUDENT',
      name: 'Sneha Reddy',
      departmentId: deptECE.id,
      email: 'student2@ugrp.dev',
      mobile: '+1-555-1002',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student3@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0003',
      role: 'STUDENT',
      name: 'Rohit Singh',
      departmentId: deptMECH.id,
      email: 'student3@ugrp.dev',
      mobile: '+1-555-1003',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student4@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0004',
      role: 'STUDENT',
      name: 'Meera Joshi',
      departmentId: deptHSS.id,
      email: 'student4@ugrp.dev',
      mobile: '+1-555-1004',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student5@ugrp.dev' },
    update: {},
    create: {
      universityId: 'UGRP-STU-0005',
      role: 'STUDENT',
      name: 'Karan Verma',
      departmentId: deptMBA.id,
      email: 'student5@ugrp.dev',
      mobile: '+1-555-1005',
      passwordHash: PASSWORD_HASH,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // -------------------------------------------------------------------------
  // 6. Grievance Categories (20+, with hierarchy)
  // -------------------------------------------------------------------------
  console.log('Creating grievance categories (SLA-mapped)...');

  // Top-level categories
  const catAcademics = await prisma.grievanceCategory.upsert({
    where: { slug: 'academics' },
    update: {},
    create: {
      name: 'Academics',
      slug: 'academics',
      stakeholderType: 'ALL',
      slaWorkingDays: 10,
      isPriorityCritical: false,
    },
  });

  const catAdministration = await prisma.grievanceCategory.upsert({
    where: { slug: 'administration' },
    update: {},
    create: {
      name: 'Administration',
      slug: 'administration',
      stakeholderType: 'ALL',
      slaWorkingDays: 7,
      isPriorityCritical: false,
    },
  });

  const catInfrastructure = await prisma.grievanceCategory.upsert({
    where: { slug: 'infrastructure-facilities' },
    update: {},
    create: {
      name: 'Infrastructure & Facilities',
      slug: 'infrastructure-facilities',
      stakeholderType: 'ALL',
      slaWorkingDays: 14,
      isPriorityCritical: false,
    },
  });

  const catFacultyConduct = await prisma.grievanceCategory.upsert({
    where: { slug: 'faculty-conduct' },
    update: {},
    create: {
      name: 'Faculty Conduct & Quality',
      slug: 'faculty-conduct',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 14,
      isPriorityCritical: true,
    },
  });

  const catExamination = await prisma.grievanceCategory.upsert({
    where: { slug: 'examination' },
    update: {},
    create: {
      name: 'Examination',
      slug: 'examination',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 5,
      isPriorityCritical: true,
    },
  });

  const catHarassment = await prisma.grievanceCategory.upsert({
    where: { slug: 'harassment-discrimination' },
    update: {},
    create: {
      name: 'Harassment & Discrimination',
      slug: 'harassment-discrimination',
      stakeholderType: 'ALL',
      slaWorkingDays: 3,
      isPriorityCritical: true,
    },
  });

  const catScholarship = await prisma.grievanceCategory.upsert({
    where: { slug: 'scholarship-financial' },
    update: {},
    create: {
      name: 'Scholarship & Financial Aid',
      slug: 'scholarship-financial',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 10,
      isPriorityCritical: false,
    },
  });

  const catPlacement = await prisma.grievanceCategory.upsert({
    where: { slug: 'placement-career' },
    update: {},
    create: {
      name: 'Placement & Career Services',
      slug: 'placement-career',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 14,
      isPriorityCritical: false,
    },
  });

  const catResearch = await prisma.grievanceCategory.upsert({
    where: { slug: 'research-thesis' },
    update: {},
    create: {
      name: 'Research & Thesis Supervision',
      slug: 'research-thesis',
      stakeholderType: 'TEACHING',
      slaWorkingDays: 21,
      isPriorityCritical: false,
    },
  });

  const catDiscipline = await prisma.grievanceCategory.upsert({
    where: { slug: 'student-discipline' },
    update: {},
    create: {
      name: 'Student Discipline',
      slug: 'student-discipline',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 7,
      isPriorityCritical: false,
    },
  });

  const catHostel = await prisma.grievanceCategory.upsert({
    where: { slug: 'hostel-accommodation' },
    update: {},
    create: {
      name: 'Hostel & Accommodation',
      slug: 'hostel-accommodation',
      stakeholderType: 'STUDENT',
      slaWorkingDays: 7,
      isPriorityCritical: false,
    },
  });

  const catTransport = await prisma.grievanceCategory.upsert({
    where: { slug: 'transport-commute' },
    update: {},
    create: {
      name: 'Transport & Commute',
      slug: 'transport-commute',
      stakeholderType: 'ALL',
      slaWorkingDays: 14,
      isPriorityCritical: false,
    },
  });

  const catCanteen = await prisma.grievanceCategory.upsert({
    where: { slug: 'canteen-food' },
    update: {},
    create: {
      name: 'Canteen & Food Services',
      slug: 'canteen-food',
      stakeholderType: 'ALL',
      slaWorkingDays: 7,
      isPriorityCritical: false,
    },
  });

  // Sub-categories under Academics
  const catAcadCurriculum = await prisma.grievanceCategory.upsert({
    where: { slug: 'academics-curriculum' },
    update: {},
    create: {
      name: 'Curriculum & Syllabus',
      slug: 'academics-curriculum',
      parentId: catAcademics.id,
      stakeholderType: 'STUDENT',
      slaWorkingDays: 10,
      isPriorityCritical: false,
    },
  });

  const catAcadGrading = await prisma.grievanceCategory.upsert({
    where: { slug: 'academics-grading' },
    update: {},
    create: {
      name: 'Grading & Evaluation',
      slug: 'academics-grading',
      parentId: catAcademics.id,
      stakeholderType: 'STUDENT',
      slaWorkingDays: 7,
      isPriorityCritical: true,
    },
  });

  const catAcadTimetable = await prisma.grievanceCategory.upsert({
    where: { slug: 'academics-timetable' },
    update: {},
    create: {
      name: 'Timetable Scheduling',
      slug: 'academics-timetable',
      parentId: catAcademics.id,
      stakeholderType: 'STUDENT',
      slaWorkingDays: 5,
      isPriorityCritical: false,
    },
  });

  // Sub-categories under Administration
  const catAdmAdmission = await prisma.grievanceCategory.upsert({
    where: { slug: 'administration-admission' },
    update: {},
    create: {
      name: 'Admission Process',
      slug: 'administration-admission',
      parentId: catAdministration.id,
      stakeholderType: 'STUDENT',
      slaWorkingDays: 7,
      isPriorityCritical: false,
    },
  });

  const catAdmFees = await prisma.grievanceCategory.upsert({
    where: { slug: 'administration-fees' },
    update: {},
    create: {
      name: 'Fee & Accounts',
      slug: 'administration-fees',
      parentId: catAdministration.id,
      stakeholderType: 'ALL',
      slaWorkingDays: 7,
      isPriorityCritical: true,
    },
  });

  const catAdmCertificates = await prisma.grievanceCategory.upsert({
    where: { slug: 'administration-certificates' },
    update: {},
    create: {
      name: 'Certificates & Documents',
      slug: 'administration-certificates',
      parentId: catAdministration.id,
      stakeholderType: 'ALL',
      slaWorkingDays: 10,
      isPriorityCritical: false,
    },
  });

  const catAdmIT = await prisma.grievanceCategory.upsert({
    where: { slug: 'administration-it' },
    update: {},
    create: {
      name: 'IT & Portal Issues',
      slug: 'administration-it',
      parentId: catAdministration.id,
      stakeholderType: 'ALL',
      slaWorkingDays: 5,
      isPriorityCritical: false,
    },
  });

  // Sub-categories under Infrastructure
  const catInfraLabs = await prisma.grievanceCategory.upsert({
    where: { slug: 'infrastructure-labs' },
    update: {},
    create: {
      name: 'Laboratories',
      slug: 'infrastructure-labs',
      parentId: catInfrastructure.id,
      stakeholderType: 'TEACHING',
      slaWorkingDays: 14,
      isPriorityCritical: false,
    },
  });

  const catInfraLibrary = await prisma.grievanceCategory.upsert({
    where: { slug: 'infrastructure-library' },
    update: {},
    create: {
      name: 'Library Services',
      slug: 'infrastructure-library',
      parentId: catInfrastructure.id,
      stakeholderType: 'ALL',
      slaWorkingDays: 10,
      isPriorityCritical: false,
    },
  });

  const catInfraCampus = await prisma.grievanceCategory.upsert({
    where: { slug: 'infrastructure-campus' },
    update: {},
    create: {
      name: 'Campus Maintenance',
      slug: 'infrastructure-campus',
      parentId: catInfrastructure.id,
      stakeholderType: 'ALL',
      slaWorkingDays: 14,
      isPriorityCritical: false,
    },
  });

  // -------------------------------------------------------------------------
  // Workflow Rules
  // -------------------------------------------------------------------------
  console.log('Creating workflow rules...');

  await prisma.workflowRule.createMany({
    data: [
      {
        categoryId: catHarassment.id,
        stakeholderType: 'ALL',
        responderRole: 'COMMITTEE',
        slaOverrideDays: 2,
        isActive: true,
        createdAt: new Date(),
      },
      {
        categoryId: catExamination.id,
        stakeholderType: 'STUDENT',
        responderRole: 'REGISTRAR',
        slaOverrideDays: 3,
        isActive: true,
        createdAt: new Date(),
      },
      {
        categoryId: catAcadGrading.id,
        stakeholderType: 'STUDENT',
        responderRole: 'HOD',
        responderId: hodCS.id,
        slaOverrideDays: 3,
        isActive: true,
        createdAt: new Date(),
      },
      {
        categoryId: catAdmFees.id,
        stakeholderType: 'ALL',
        responderRole: 'REGISTRAR',
        slaOverrideDays: 5,
        isActive: true,
        createdAt: new Date(),
      },
      {
        categoryId: catInfraLabs.id,
        stakeholderType: 'TEACHING',
        responderRole: 'HOD',
        responderId: hodECE.id,
        isActive: true,
        createdAt: new Date(),
      },
      {
        stakeholderType: 'STUDENT',
        responderRole: 'COMMITTEE',
        isActive: true,
        createdAt: new Date(),
      },
      {
        stakeholderType: 'TEACHING',
        responderRole: 'COMMITTEE',
        isActive: true,
        createdAt: new Date(),
      },
      {
        stakeholderType: 'NON_TEACHING',
        responderRole: 'ADMIN',
        responderId: hodCS.id,
        isActive: true,
        createdAt: new Date(),
      },
    ],
  });

  // -------------------------------------------------------------------------
  // Sample Grievances (5 — different statuses and priorities)
  // -------------------------------------------------------------------------
  console.log('Creating sample grievances...');

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  function generateGrievanceId(deptCode: string, date: Date): string {
    const year = date.getFullYear();
    const code = deptCode.substring(0, 3).toUpperCase();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return 'UGRP-' + year + '-' + code + '-' + seq;
  }

  const grievance1 = await prisma.grievance.create({
    data: {
      grievanceId: generateGrievanceId('CSE', now),
      complainantId: student1.id,
      categoryId: catFacultyConduct.id,
      departmentId: deptCS.id,
      description:
        'Faculty member consistently arrives 30+ minutes late for lectures and skips lab sessions without prior notice.',
      status: 'UNDER_REVIEW',
      isAnonymous: false,
      priorityFlag: 'HIGH',
      slaDeadline: new Date(now.getTime() + 14 * dayMs),
      createdAt: now,
    },
  });

  const grievance2 = await prisma.grievance.create({
    data: {
      grievanceId: generateGrievanceId('ECE', now),
      complainantId: student2.id,
      categoryId: catAcadGrading.id,
      departmentId: deptECE.id,
      description:
        'Midterm exam was graded incorrectly. Several students received marks that do not match the answer key.',
      status: 'ACKNOWLEDGED',
      isAnonymous: false,
      priorityFlag: 'CRITICAL',
      slaDeadline: new Date(now.getTime() + 7 * dayMs),
      createdAt: now,
    },
  });

  const grievance3 = await prisma.grievance.create({
    data: {
      grievanceId: generateGrievanceId('HSS', now),
      complainantId: student4.id,
      categoryId: catAdmAdmission.id,
      departmentId: deptHSS.id,
      description:
        'Admission offer letter was delayed by 3 weeks causing enrollment issues.',
      status: 'RESOLVED',
      isAnonymous: false,
      priorityFlag: 'NORMAL',
      slaDeadline: new Date(now.getTime() + 7 * dayMs),
      resolvedAt: new Date(now.getTime() - 2 * dayMs),
      createdAt: new Date(now.getTime() - 10 * dayMs),
    },
  });

  const grievance4 = await prisma.grievance.create({
    data: {
      grievanceId: generateGrievanceId('MECH', now),
      complainantId: student3.id,
      categoryId: catInfraLabs.id,
      departmentId: deptMECH.id,
      description:
        'Lab equipment in Heat Transfer lab is non-functional; 4 out of 12 setups are broken.',
      status: 'SUBMITTED',
      isAnonymous: false,
      priorityFlag: 'NORMAL',
      slaDeadline: new Date(now.getTime() + 14 * dayMs),
      createdAt: now,
    },
  });

  const grievance5 = await prisma.grievance.create({
    data: {
      grievanceId: generateGrievanceId('MBA', now),
      complainantId: student5.id,
      categoryId: catPlacement.id,
      departmentId: deptMBA.id,
      description:
        'Placement cell has not updated the drive schedule for 2 months. Multiple companies visited without notification.',
      status: 'CLOSED',
      isAnonymous: false,
      priorityFlag: 'NORMAL',
      slaDeadline: new Date(now.getTime() + 14 * dayMs),
      resolvedAt: new Date(now.getTime() - 20 * dayMs),
      createdAt: new Date(now.getTime() - 30 * dayMs),
    },
  });

  // -------------------------------------------------------------------------
  // GrievanceTimelines
  // -------------------------------------------------------------------------
  console.log('Creating grievance timelines...');

  await prisma.grievanceTimeline.createMany({
    data: [
      {
        grievanceId: grievance1.id,
        status: 'SUBMITTED',
        note: 'Grievance filed by Amit Patel (CSE-3rd Year)',
        actorId: student1.id,
        createdAt: now,
      },
      {
        grievanceId: grievance1.id,
        status: 'ACKNOWLEDGED',
        note: 'Acknowledged by HOD — forwarding to committee',
        actorId: hodCS.id,
        createdAt: new Date(now.getTime() + dayMs),
      },
      {
        grievanceId: grievance1.id,
        status: 'UNDER_REVIEW',
        note: 'Committee assigned for investigation',
        actorId: committee1.id,
        createdAt: new Date(now.getTime() + 2 * dayMs),
      },
      {
        grievanceId: grievance2.id,
        status: 'SUBMITTED',
        note: 'Grading dispute filed by Sneha Reddy (ECE-2nd Year)',
        actorId: student2.id,
        createdAt: now,
      },
      {
        grievanceId: grievance2.id,
        status: 'ACKNOWLEDGED',
        note: 'Acknowledged. Exam papers pulled for re-evaluation.',
        actorId: hodECE.id,
        createdAt: new Date(now.getTime() + dayMs),
      },
      {
        grievanceId: grievance3.id,
        status: 'SUBMITTED',
        note: 'Admission delay complaint filed by Meera Joshi (HSS-1st Year)',
        actorId: student4.id,
        createdAt: new Date(now.getTime() - 10 * dayMs),
      },
      {
        grievanceId: grievance3.id,
        status: 'RESOLVED',
        note: 'Admission letter reissued. Issue resolved.',
        actorId: hodCS.id,
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
      {
        grievanceId: grievance5.id,
        status: 'SUBMITTED',
        note: 'Placement schedule complaint filed by Karan Verma (MBA-2nd Year)',
        actorId: student5.id,
        createdAt: new Date(now.getTime() - 30 * dayMs),
      },
      {
        grievanceId: grievance5.id,
        status: 'CLOSED',
        note: 'Placement portal updated. Cell confirmed schedule is now live.',
        actorId: hodCS.id,
        createdAt: new Date(now.getTime() - 20 * dayMs),
      },
    ],
  });

  // -------------------------------------------------------------------------
  // Messages (3)
  // -------------------------------------------------------------------------
  console.log('Creating sample messages...');

  await prisma.message.createMany({
    data: [
      {
        grievanceId: grievance1.id,
        senderId: student1.id,
        body: 'Hi, I would like to add that this has been happening since the start of the semester.',
        createdAt: new Date(now.getTime() + 2 * dayMs),
      },
      {
        grievanceId: grievance1.id,
        senderId: committee1.id,
        body: 'Thank you for the additional details. We have scheduled a hearing for next Monday.',
        createdAt: new Date(now.getTime() + 3 * dayMs),
      },
      {
        grievanceId: grievance2.id,
        senderId: student2.id,
        body: 'I have a copy of the answer key that was provided by the professor.',
        createdAt: new Date(now.getTime() + dayMs),
      },
      {
        grievanceId: grievance4.id,
        senderId: student3.id,
        body: 'I am attaching photos of the broken equipment in Lab 3.',
        createdAt: now,
      },
      {
        grievanceId: grievance4.id,
        senderId: hodECE.id,
        body: 'We have raised a maintenance ticket. ETA for repair is 5 working days.',
        createdAt: new Date(now.getTime() + dayMs),
      },
    ],
  });

  // -------------------------------------------------------------------------
  // Notifications (5)
  // -------------------------------------------------------------------------
  console.log('Creating sample notifications...');

  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        grievanceId: grievance1.id,
        type: 'STATUS_UPDATE',
        channel: 'IN_APP',
        status: 'SENT',
        sentAt: new Date(now.getTime() + dayMs),
        createdAt: new Date(now.getTime() + dayMs),
      },
      {
        userId: student2.id,
        grievanceId: grievance2.id,
        type: 'ACKNOWLEDGEMENT',
        channel: 'EMAIL',
        status: 'SENT',
        sentAt: new Date(now.getTime() + dayMs),
        createdAt: new Date(now.getTime() + dayMs),
      },
      {
        userId: student4.id,
        grievanceId: grievance3.id,
        type: 'RESOLUTION',
        channel: 'IN_APP',
        status: 'SENT',
        sentAt: new Date(now.getTime() - 2 * dayMs),
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
      {
        userId: student5.id,
        grievanceId: grievance5.id,
        type: 'CLOSURE',
        channel: 'SMS',
        status: 'SENT',
        sentAt: new Date(now.getTime() - 20 * dayMs),
        createdAt: new Date(now.getTime() - 20 * dayMs),
      },
      {
        userId: hodCS.id,
        grievanceId: grievance1.id,
        type: 'ESCALATION',
        channel: 'EMAIL',
        status: 'PENDING',
        createdAt: new Date(now.getTime() + 2 * dayMs),
      },
    ],
  });

  // -------------------------------------------------------------------------
  // Attachments (3)
  // -------------------------------------------------------------------------
  console.log('Creating sample attachments...');

  await prisma.attachment.createMany({
    data: [
      {
        grievanceId: grievance1.id,
        filename: 'evidence_photo_001.jpg',
        storagePath: 'attachments/2026/CSE/evidence_photo_001.jpg',
        mimeType: 'image/jpeg',
        size: 2457600,
        createdAt: now,
      },
      {
        grievanceId: grievance2.id,
        filename: 'answer_key_math301.pdf',
        storagePath: 'attachments/2026/ECE/answer_key_math301.pdf',
        mimeType: 'application/pdf',
        size: 1048576,
        createdAt: now,
      },
      {
        grievanceId: grievance1.id,
        filename: 'timetable_discrepancy.pdf',
        storagePath: 'attachments/2026/CSE/timetable_discrepancy.pdf',
        mimeType: 'application/pdf',
        size: 524288,
        createdAt: new Date(now.getTime() + dayMs),
      },
    ],
  });

  // -------------------------------------------------------------------------
  // AuditLogs (4)
  // -------------------------------------------------------------------------
  console.log('Creating sample audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: student1.id,
        action: 'CREATE',
        targetTable: 'grievance',
        targetId: grievance1.id,
        metadata: { source: 'web', ip: '10.0.1.45' },
        ipAddress: '10.0.1.45',
        createdAt: now,
      },
      {
        actorId: hodCS.id,
        action: 'UPDATE',
        targetTable: 'grievance',
        targetId: grievance1.id,
        metadata: { status: 'ACKNOWLEDGED', note: 'Forwarded to committee' },
        ipAddress: '10.0.2.10',
        createdAt: new Date(now.getTime() + dayMs),
      },
      {
        actorId: hodCS.id,
        action: 'UPDATE',
        targetTable: 'grievance',
        targetId: grievance3.id,
        metadata: { status: 'RESOLVED' },
        ipAddress: '10.0.0.5',
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
      {
        actorId: hodCS.id,
        action: 'UPDATE',
        targetTable: 'grievance',
        targetId: grievance5.id,
        metadata: { status: 'CLOSED' },
        ipAddress: '10.0.0.5',
        createdAt: new Date(now.getTime() - 20 * dayMs),
      },
    ],
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('👤 1 Admin:          admin@ugrp.dev');
  console.log('👥 3 Committee:      chairman@ugrp.dev, member1@ugrp.dev, member2@ugrp.dev');
  console.log('🏫 3 Faculty/HOD:   faculty1@ugrp.dev, hod.cse@ugrp.dev, hod.ece@ugrp.dev');
  console.log('🎓 5 Students:       student1–5@ugrp.dev');
  console.log('📂 5 Departments:    CSE, ECE, MECH, HSS, MBA');
  console.log('🏷️  24 Categories:    10 top-level + 14 sub-categories');
  console.log('📋 5 Grievances:     UNDER_REVIEW, ACKNOWLEDGED, RESOLVED, SUBMITTED, CLOSED');
  console.log('📅 9 Timelines');
  console.log('💬 5 Messages');
  console.log('🔔 5 Notifications');
  console.log('📎 3 Attachments');
  console.log('📝 4 Audit Logs');
  console.log('📊 8 Workflow Rules');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });