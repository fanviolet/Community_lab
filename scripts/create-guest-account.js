/**
 * Script to create guest@communitylab.demo account
 * Run with: node scripts/create-guest-account.js
 *
 * Prerequisites:
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Or pass as environment variables
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createGuestAccount() {
  try {
    console.log('Creating guest account...');

    // First, check if profile exists and clean up
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'guest@communitylab.demo')
      .maybeSingle();

    if (existingProfile) {
      console.log('Found existing profile, cleaning up...');

      // Clean up related data
      await supabase.from('group_members').delete().eq('user_id', existingProfile.id);
      await supabase.from('project_members').delete().eq('user_id', existingProfile.id);
      await supabase.from('group_join_requests').delete().eq('user_id', existingProfile.id);
      await supabase.from('notifications').delete().eq('user_id', existingProfile.id);
      await supabase.from('profiles').delete().eq('id', existingProfile.id);

      console.log('Cleaned up existing profile');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'guest@communitylab.demo',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        display_name: 'Guest User',
        role: 'member'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Auth user created:', authData.user.id);

    // The profile should be auto-created by trigger, but let's verify and update it
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.log('Profile not auto-created, creating manually...');

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: 'guest@communitylab.demo',
          display_name: 'Guest User',
          role: 'member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw insertError;
      }
    } else {
      console.log('Profile already exists');
    }

    // Add to default group
    const { data: defaultGroup } = await supabase
      .from('groups')
      .select('id')
      .eq('slug', 'community-lab')
      .maybeSingle();

    if (defaultGroup) {
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: defaultGroup.id,
          user_id: authData.user.id,
          role: 'member'
        })
        .onConflict('group_id,user_id')
        .ignore();

      if (memberError) {
        console.error('Error adding to group:', memberError);
      } else {
        console.log('Added to default group');
      }
    }

    console.log('✅ Guest account created successfully!');
    console.log('Email: guest@communitylab.demo');
    console.log('Password: demo123');
    console.log('User ID:', authData.user.id);

  } catch (error) {
    console.error('❌ Error creating guest account:', error);
    process.exit(1);
  }
}

createGuestAccount();
