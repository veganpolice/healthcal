import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          id: string
          user_id: string
          step: string
          preferences: any
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          step: string
          preferences: any
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          step?: string
          preferences?: any
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const url = new URL(req.url)
    const step = url.searchParams.get('step')

    switch (req.method) {
      case 'GET':
        return await handleGet(supabaseClient, user.id, step)
      case 'POST':
        return await handlePost(supabaseClient, user.id, req)
      case 'PUT':
        return await handlePut(supabaseClient, user.id, req)
      case 'DELETE':
        return await handleDelete(supabaseClient, user.id, step)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }
  } catch (error) {
    console.error('Error in user-preferences function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleGet(supabaseClient: any, userId: string, step: string | null) {
  try {
    let query = supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)

    if (step) {
      query = query.eq('step', step).single()
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return new Response(
      JSON.stringify({ data: data || (step ? null : []), error: null }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in handleGet:', error)
    return new Response(
      JSON.stringify({ data: null, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function handlePost(supabaseClient: any, userId: string, req: Request) {
  try {
    const body = await req.json()
    const { step, preferences } = body

    if (!step || !preferences) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: step, preferences' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data, error } = await supabaseClient
      .from('user_preferences')
      .insert({
        user_id: userId,
        step,
        preferences,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ data, error: null }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in handlePost:', error)
    return new Response(
      JSON.stringify({ data: null, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function handlePut(supabaseClient: any, userId: string, req: Request) {
  try {
    const body = await req.json()
    const { step, preferences } = body

    if (!step || !preferences) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: step, preferences' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // First, try to update existing preference
    const { data: existingData } = await supabaseClient
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('step', step)
      .single()

    let result
    if (existingData) {
      // Update existing
      result = await supabaseClient
        .from('user_preferences')
        .update({
          preferences,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingData.id)
        .select()
        .single()
    } else {
      // Create new if doesn't exist
      result = await supabaseClient
        .from('user_preferences')
        .insert({
          user_id: userId,
          step,
          preferences,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return new Response(
      JSON.stringify({ data: result.data, error: null }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in handlePut:', error)
    return new Response(
      JSON.stringify({ data: null, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function handleDelete(supabaseClient: any, userId: string, step: string | null) {
  try {
    if (!step) {
      return new Response(
        JSON.stringify({ error: 'Step parameter is required for delete' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { error } = await supabaseClient
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('step', step)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, error: null }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in handleDelete:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}