
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  role: string;
  invitationToken: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, invitationToken, inviterName }: InvitationEmailRequest = await req.json();

    const inviteUrl = `${req.headers.get('origin') || 'https://your-app.com'}/admin/accept-invitation?token=${invitationToken}`;
    
    const emailResponse = await resend.emails.send({
      from: "SettleSmart AI <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join SettleSmart AI as ${role === 'super_admin' ? 'Super Admin' : 'Admin'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 20px;">Welcome to SettleSmart AI!</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${inviterName ? `${inviterName} has` : 'You have been'} invited you to join SettleSmart AI as ${role === 'super_admin' ? 'a Super Admin' : 'an Admin'}.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Click the button below to accept your invitation and set up your account:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
            ${inviteUrl}
          </p>
          
          <p style="color: #888; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            SettleSmart AI - Real Estate Management Platform
          </p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
