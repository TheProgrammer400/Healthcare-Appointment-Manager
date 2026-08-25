import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding healthcare appointment manager database...');

  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);
  const doctorPasswordHash = await bcrypt.hash('DoctorPassword123!', 12);
  const patientPasswordHash = await bcrypt.hash('PatientPassword123!', 12);

  // 1. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      email: 'admin@clinic.com',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      role: UserRole.ADMIN,
      phone: '+1-555-0100',
    },
  });
  console.log('Created Admin:', adminUser.email);

  // 2. Create Doctors & Profiles
  const doctorsData = [
    {
      email: 'dr.smith@clinic.com',
      fullName: 'Dr. Sarah Smith',
      specialisation: 'Cardiology',
      slotDurationMinutes: 30,
      bio: 'Board certified cardiologist with 15+ years experience in preventive heart care.',
    },
    {
      email: 'dr.johnson@clinic.com',
      fullName: 'Dr. Michael Johnson',
      specialisation: 'Dermatology',
      slotDurationMinutes: 30,
      bio: 'Expert dermatologist specializing in medical and cosmetic skin treatments.',
    },
    {
      email: 'dr.williams@clinic.com',
      fullName: 'Dr. Emily Williams',
      specialisation: 'Pediatrics',
      slotDurationMinutes: 15,
      bio: 'Compassionate pediatrician focused on comprehensive child health and wellness.',
    },
  ];

  for (const docData of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: docData.email },
      update: {},
      create: {
        email: docData.email,
        passwordHash: doctorPasswordHash,
        fullName: docData.fullName,
        role: UserRole.DOCTOR,
        phone: '+1-555-0200',
      },
    });

    const docProfile = await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialisation: docData.specialisation,
        slotDurationMinutes: docData.slotDurationMinutes,
        bio: docData.bio,
      },
    });

    // Default working hours: Monday through Friday, 09:00 to 17:00
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      await prisma.doctorWorkingHours.upsert({
        where: {
          doctorId_dayOfWeek: {
            doctorId: docProfile.id,
            dayOfWeek,
          },
        },
        update: {},
        create: {
          doctorId: docProfile.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
        },
      });
    }

    console.log(`Created Doctor: ${user.fullName} (${docData.specialisation})`);
  }

  // 3. Create Sample Patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@clinic.com' },
    update: {},
    create: {
      email: 'patient@clinic.com',
      passwordHash: patientPasswordHash,
      fullName: 'John Doe',
      role: UserRole.PATIENT,
      phone: '+1-555-0300',
    },
  });

  await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      dateOfBirth: new Date('1990-05-15'),
    },
  });
  console.log('Created Sample Patient:', patientUser.email);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
