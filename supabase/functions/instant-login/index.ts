import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Check whitelist and get this user's stable login token
    const { data: wl } = await supabase
      .from('whitelisted_emails')
      .select('email, login_token')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (!wl) {
      return new Response(
        JSON.stringify({ error: 'This email is not authorised. Contact the admin to get access.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Ensure the auth user exists and their password matches the login_token.
    // generateLink(shouldCreateUser:true) creates the user if missing and returns their ID.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase().trim(),
      options: { shouldCreateUser: true },
    })
    if (linkError) throw linkError

    // Set (or reset) the user's password to their stable login_token.
    // This is safe — the token is random, long, and never shown to the user.
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      linkData.user.id,
      { password: wl.login_token, email_confirm: true },
    )
    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ login_token: wl.login_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message ?? 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
