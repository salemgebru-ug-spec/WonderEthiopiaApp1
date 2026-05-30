import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to take our messages");
  }
});

export async function sendApprovalEmail(
  to: string,
  businessName: string,
  tempPassword: string
) {
  const isNewAccount = !!tempPassword;
  
  const mailOptions = {
    from: `"Wondar Ethiopia" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Congratulations! Your Business "${businessName}" is Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b; text-align: center;">Welcome to Wondar Ethiopia!</h2>
        <p>Dear Business Owner,</p>
        <p>We are thrilled to inform you that your registration for <strong>${businessName}</strong> has been <strong>Approved</strong> by the Super Admin.</p>
        
        ${isNewAccount ? `
        <p>An account has been created for you. You can now log in to the Business Portal to manage your services and listings.</p>
        
        <div style="background-color: #fffbeb; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #fde68a;">
          <h3 style="margin-top: 0; color: #d97706; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Institutional Verification Hub</h3>
          <p style="margin-bottom: 8px; font-size: 14px;"><strong>Registry Channel:</strong> ${to}</p>
          <p style="margin-bottom: 0; font-size: 14px;"><strong>Temporary Credentials:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 6px; border: 1px solid #eee;">${tempPassword}</code></p>
        </div>
        
        <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">For security protocol compliance, you are required to initialize your unique partner credentials before participating in the Wonder Ethiopia registry.</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.NEXTAUTH_URL}/setup-security?email=${encodeURIComponent(to)}&temp=${encodeURIComponent(tempPassword)}" style="background-color: #f59e0b; color: #000; padding: 16px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; display: inline-block;">Secure Your Account</a>
        </div>
        ` : `
        <p>Your existing account has been granted access to the Business Portal. You can now log in with your current credentials to manage <strong>${businessName}</strong>.</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.NEXTAUTH_URL}/login" style="background-color: #f59e0b; color: #000; padding: 16px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; display: inline-block;">Go to Login</a>
        </div>
        `}
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">© 2026 Wondar Ethiopia. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendRejectionEmail(
  to: string,
  businessName: string,
  reason: string
) {
  const mailOptions = {
    from: `"Wondar Ethiopia" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Application Status Update: ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444; text-align: center;">Application Status Update</h2>
        <p>Dear Business Applicant,</p>
        <p>Thank you for your interest in registering your business, <strong>${businessName}</strong>, with Wondar Ethiopia.</p>
        <p>After a thorough review, we regret to inform you that your application has been <strong>Rejected</strong> at this time.</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
          <h3 style="margin-top: 0; color: #b91c1c;">Reason for Rejection</h3>
          <p style="margin-bottom: 0; color: #7f1d1d;">${reason || "Information provided does not meet the platform requirements."}</p>
        </div>
        
        <p>You are welcome to re-apply once the issues mentioned above have been addressed. If you have any questions, please feel free to contact our support team.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">© 2026 Wondar Ethiopia. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendBookingEmail(
  to: string,
  serviceName: string,
  businessName: string,
  date: string,
  guests: number,
  price: string
) {
  const mailOptions = {
    from: `"Wondar Ethiopia" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Reservation Transmitted: ${serviceName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 30px;">
           <div style="display: inline-block; padding: 12px; background: #f59e0b; border-radius: 12px; color: white; font-weight: 900;">W</div>
        </div>
        <h2 style="text-align: center; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 8px;">Reservation Log Secured</h2>
        <p style="text-align: center; color: #666; margin-bottom: 40px;">Your reservation for <strong>${serviceName}</strong> has been transmitted to <strong>${businessName}</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 24px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #f3f4f6;">
          <h3 style="margin-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #999;">Manifest Details</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Service Asset</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Date of Arrival</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Explorer Count</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${guests} People</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-top: 1px dashed #ddd; margin-top: 8px;">Total Intensity</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 900; color: #f59e0b; border-top: 1px dashed #ddd; margin-top: 8px;">${price}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 13px; color: #666; line-height: 1.6;">The partner will review your reservation and confirm final logistics shortly. You can track the real-time status of this reservation in your dashboard.</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/bookings" style="background-color: #1a1a1a; color: #fff; padding: 16px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Review Log</a>
        </div>
        
        <div style="margin-top: 60px; padding-top: 24px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em;">
          Institutional Discovery Registry — wonderethiopia.et
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendExpansionApprovalEmail(
  to: string,
  businessName: string,
  newCategories: string[]
) {
  const categoryList = newCategories.map(c => c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
  const mailOptions = {
    from: `"Wondar Ethiopia" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Domain Expansion Approved: ${businessName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 20px; background: #FFAA33; border-radius: 12px; color: white; font-weight: 900; font-size: 18px;">Wondar Ethiopia</div>
        </div>
        <h2 style="text-align: center; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin-bottom: 8px;">Domain Expansion Approved ✓</h2>
        <p style="text-align: center; color: #666; margin-bottom: 36px; font-size: 15px;">Your expansion request has been approved by the Super Admin.</p>

        <div style="background: #fffbeb; padding: 24px; border-radius: 16px; border: 1px solid #fde68a; margin-bottom: 28px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #d97706; font-weight: 900;">Newly Activated Domains</p>
          <p style="margin: 0; font-size: 18px; font-weight: 900; color: #1a1a1a;">${categoryList}</p>
        </div>

        <p style="font-size: 14px; color: #555; line-height: 1.7;">
          Your business <strong>${businessName}</strong> has been officially granted access to operate in the above domains on the Wondar Ethiopia platform. You can now add services, manage listings, and receive bookings in these new categories.
        </p>

        <div style="text-align: center; margin-top: 36px;">
          <a href="${process.env.NEXTAUTH_URL}/business/dashboard" style="background-color: #FFAA33; color: #000; padding: 14px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Open Business Dashboard</a>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em;">
          Wondar Ethiopia Institutional Registry
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendExpansionRejectionEmail(
  to: string,
  businessName: string,
  requestedCategories: string[],
  reason?: string
) {
  const categoryList = requestedCategories.map(c => c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
  const mailOptions = {
    from: `"Wondar Ethiopia" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Domain Expansion Update: ${businessName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 20px; background: #FFAA33; border-radius: 12px; color: white; font-weight: 900; font-size: 18px;">Wondar Ethiopia</div>
        </div>
        <h2 style="text-align: center; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin-bottom: 8px;">Expansion Request Update</h2>
        <p style="text-align: center; color: #666; margin-bottom: 36px; font-size: 15px;">Your domain expansion request has been reviewed.</p>

        <div style="background: #fef2f2; padding: 24px; border-radius: 16px; border: 1px solid #fee2e2; margin-bottom: 28px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #b91c1c; font-weight: 900;">Requested Domains — Not Approved</p>
          <p style="margin: 0; font-size: 18px; font-weight: 900; color: #1a1a1a;">${categoryList}</p>
        </div>

        ${reason ? `
        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #f0f0f0;">
          <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #999; font-weight: 900;">Decision Note</p>
          <p style="margin: 0; font-size: 14px; color: #555; font-style: italic;">"${reason}"</p>
        </div>
        ` : ""}

        <p style="font-size: 14px; color: #555; line-height: 1.7;">
          We appreciate your interest in expanding <strong>${businessName}</strong> on the Wondar Ethiopia platform. You are welcome to re-apply for domain expansion after addressing the noted concerns.
        </p>

        <div style="text-align: center; margin-top: 36px;">
          <a href="${process.env.NEXTAUTH_URL}/business/dashboard" style="background-color: #1a1a1a; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Back to Dashboard</a>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em;">
          Wondar Ethiopia Institutional Registry
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendWarningEmail(
  to: string,
  businessName: string,
  reason: string
) {
  const mailOptions = {
    from: `"Wondar Ethiopia Compliance" <${process.env.EMAIL_USER}>`,
    to,
    subject: `URGENT: Official Warning for ${businessName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 20px; background: #ef4444; border-radius: 12px; color: white; font-weight: 900; font-size: 18px;">Wondar Ethiopia</div>
        </div>
        <h2 style="text-align: center; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin-bottom: 8px;">Official Compliance Warning ⚠️</h2>
        <p style="text-align: center; color: #666; margin-bottom: 36px; font-size: 15px;">Your business has received a formal warning regarding a reported grievance.</p>

        <div style="background: #fef2f2; padding: 24px; border-radius: 16px; border: 1px solid #fee2e2; margin-bottom: 28px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #b91c1c; font-weight: 900;">Admin Determination</p>
          <p style="margin: 0; font-size: 14px; font-style: italic; color: #7f1d1d;">"${reason}"</p>
        </div>

        <p style="font-size: 14px; color: #555; line-height: 1.7;">
          <strong>${businessName}</strong> must adhere strictly to the Wondar Ethiopia platform service policies. This is a formal warning. <strong>Further violations or failure to address the stated concern will result in immediate suspension of your business account and removal from the platform registry.</strong>
        </p>

        <div style="text-align: center; margin-top: 36px;">
          <a href="${process.env.NEXTAUTH_URL}/business/dashboard" style="background-color: #1a1a1a; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Review in Dashboard</a>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em;">
          Wondar Ethiopia Compliance Authority
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendSuspensionEmail(
  to: string,
  businessName: string,
  reason: string
) {
  const mailOptions = {
    from: `"Wondar Ethiopia Compliance" <${process.env.EMAIL_USER}>`,
    to,
    subject: `CRITICAL: Business Suspension Notice for ${businessName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 20px; background: #dc2626; border-radius: 12px; color: white; font-weight: 900; font-size: 18px;">Wondar Ethiopia</div>
        </div>
        <h2 style="text-align: center; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin-bottom: 8px;">Business Suspension 🚫</h2>
        <p style="text-align: center; color: #666; margin-bottom: 36px; font-size: 15px;">Your business operations have been officially suspended.</p>

        <div style="background: #fef2f2; padding: 24px; border-radius: 16px; border: 1px solid #fee2e2; margin-bottom: 28px;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #b91c1c; font-weight: 900;">Admin Determination</p>
          <p style="margin: 0; font-size: 14px; font-style: italic; color: #7f1d1d;">"${reason}"</p>
        </div>

        <p style="font-size: 14px; color: #555; line-height: 1.7;">
          Due to severe or repeated violations of platform policies, <strong>${businessName}</strong> has been suspended. All active services are hidden from tourists, and your business is no longer in good standing.
        </p>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #fde68a;">
          <h3 style="margin-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #d97706;">Appeal Instructions (CRITICAL)</h3>
          <p style="margin-bottom: 0; font-size: 13px; color: #92400e;">You must physically report to the Ministry of Tourism with your business credentials to file an appeal and restore your registry standing.</p>
        </div>

        <div style="text-align: center; margin-top: 36px;">
          <a href="${process.env.NEXTAUTH_URL}/business/reports" style="background-color: #1a1a1a; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">View Grievance Record</a>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em;">
          Wondar Ethiopia Compliance Authority
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendInactivityWarningEmail(
  to: string,
  businessName: string,
  gracePeriodDays: number
) {
  const mailOptions = {
    from: `"Wondar Ethiopia Compliance" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Action Required: Inactivity Warning for ${businessName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 20px; background: #f59e0b; border-radius: 12px; color: white; font-weight: 900; font-size: 18px;">Wondar Ethiopia</div>
        </div>
        <h2 style="text-align: center; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin-bottom: 8px;">Inactivity Warning ⚠️</h2>
        <p style="text-align: center; color: #666; margin-bottom: 36px; font-size: 15px;">We noticed that you haven't updated your business profile or services recently.</p>

        <p style="font-size: 14px; color: #555; line-height: 1.7;">
          To ensure tourists have access to accurate and up-to-date information, we require active participation from our partners. <strong>${businessName}</strong> will be removed from the active directory if no activity is detected within the next <strong>${gracePeriodDays} days</strong>.
        </p>

        <div style="text-align: center; margin-top: 36px;">
          <a href="${process.env.NEXTAUTH_URL}/business/dashboard" style="background-color: #1a1a1a; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Log In & Update Profile</a>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em;">
          Wondar Ethiopia Compliance Authority
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendInactivityRemovalEmail(
  to: string,
  businessName: string
) {
  const mailOptions = {
    from: `"Wondar Ethiopia Compliance" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Notice: ${businessName} Suspended Due to Inactivity`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 20px; background: #dc2626; border-radius: 12px; color: white; font-weight: 900; font-size: 18px;">Wondar Ethiopia</div>
        </div>
        <h2 style="text-align: center; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #1a1a1a; margin-bottom: 8px;">Business Suspended 🚫</h2>
        <p style="text-align: center; color: #666; margin-bottom: 36px; font-size: 15px;">Your business operations have been officially suspended due to prolonged inactivity.</p>

        <p style="font-size: 14px; color: #555; line-height: 1.7;">
          Despite our previous warning, we did not detect any activity from <strong>${businessName}</strong>. As a result, your business has been suspended and removed from the active directory.
        </p>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #fde68a;">
          <p style="margin-bottom: 0; font-size: 13px; color: #92400e;">To restore your registry standing, you must physically report to the Ministry of Tourism with your business credentials to file an appeal.</p>
        </div>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em;">
          Wondar Ethiopia Compliance Authority
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}
