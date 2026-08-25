export function bookingConfirmationTemplate(params: {
  patientName: string;
  doctorName: string;
  specialisation: string;
  startAt: Date;
}) {
  const dateStr = params.startAt.toUTCString();
  return {
    subject: `Appointment Confirmed with ${params.doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Appointment Confirmed</h2>
        <p>Dear ${params.patientName},</p>
        <p>Your appointment has been successfully confirmed with <strong>${params.doctorName}</strong> (${params.specialisation}).</p>
        <p><strong>Date & Time:</strong> ${dateStr}</p>
        <p>Thank you for choosing our healthcare service!</p>
      </div>
    `,
  };
}

export function cancellationTemplate(params: {
  recipientName: string;
  doctorName: string;
  startAt: Date;
  reason?: string;
}) {
  const dateStr = params.startAt.toUTCString();
  return {
    subject: `Appointment Cancelled - ${params.doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Appointment Cancelled</h2>
        <p>Dear ${params.recipientName},</p>
        <p>The appointment scheduled for <strong>${dateStr}</strong> with <strong>${params.doctorName}</strong> has been cancelled.</p>
        ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ''}
        <p>If you need to reschedule, please visit our online portal.</p>
      </div>
    `,
  };
}

export function leaveConflictTemplate(params: {
  patientName: string;
  doctorName: string;
  startAt: Date;
}) {
  const dateStr = params.startAt.toUTCString();
  return {
    subject: `Important Notice: Appointment Cancelled due to Doctor Leave`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Doctor Availability Update</h2>
        <p>Dear ${params.patientName},</p>
        <p>Regrettably, <strong>${params.doctorName}</strong> will be away on leave on <strong>${dateStr}</strong>.</p>
        <p>Your appointment has been cancelled. Please log in to your account to select an alternative slot or book with another doctor.</p>
      </div>
    `,
  };
}

export function medicationReminderTemplate(params: {
  patientName: string;
  medicineName: string;
}) {
  return {
    subject: `Medication Reminder: ${params.medicineName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Medication Reminder</h2>
        <p>Dear ${params.patientName},</p>
        <p>This is a friendly reminder to take your prescribed medication: <strong>${params.medicineName}</strong>.</p>
        <p>Stay healthy!</p>
      </div>
    `,
  };
}
