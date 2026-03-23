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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check whitelist
    const { data: whitelisted } = await supabase
      .from('whitelisted_emails')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (!whitelisted) {
      return new Response(
        JSON.stringify({ error: 'This email is not authorised. Contact the admin to get access.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Generate a magic link token (no email sent)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase().trim(),
      options: { shouldCreateUser: true },
    })
    if (linkError) throw linkError

    // Fetch the verify URL server-side without following the redirect.
    // Supabase responds with a 303 → Location header contains the tokens in the hash.
    const verifyUrl = new URL(linkData.properties.action_link)
    verifyUrl.searchParams.set('redirect_to', 'https://placeholder.invalid')

    const verifyRes = await fetch(verifyUrl.toString(), { redirect: 'manual' })
    const location = verifyRes.headers.get('location') ?? ''

    // Tokens are in the URL hash: #access_token=...&refresh_token=...
    const hash = location.includes('#') ? location.split('#')[1] : ''
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      throw new Error('Could not retrieve session from auth server. Check Supabase Site URL / Redirect URL settings.')
    }

    return new Response(
      JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message ?? 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
