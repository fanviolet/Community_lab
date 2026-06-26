/**
 * Demo Data Seeding Script
 * 
 * This script seeds the database with demo data for testing purposes:
 * - 10 problems
 * - 5 pitches
 * - 5 projects
 * 
 * Usage: npx tsx scripts/seed-demo.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Demo Problems
const demoProblems = [
  {
    title: "Improve local public transportation",
    description: "Our city's public transportation system is inefficient with long wait times and limited coverage. We need to develop a comprehensive solution that includes better route planning, real-time tracking, and improved infrastructure.",
    category: "infrastructure",
    status: "open",
    upvotes: 42,
  },
  {
    title: "Reduce food waste in restaurants",
    description: "Restaurants in our area generate significant food waste daily. We need a system to redistribute surplus food to shelters and food banks while maintaining food safety standards.",
    category: "environment",
    status: "open",
    upvotes: 38,
  },
  {
    title: "Digital literacy program for seniors",
    description: "Many seniors in our community struggle with basic digital tasks like online banking, telehealth appointments, and connecting with family. We need a structured program to help them navigate the digital world safely.",
    category: "education",
    status: "open",
    upvotes: 35,
  },
  {
    title: "Community garden network",
    description: "Transform unused urban spaces into productive community gardens that provide fresh produce, green spaces, and educational opportunities for neighborhood residents.",
    category: "environment",
    status: "open",
    upvotes: 31,
  },
  {
    title: "Youth mentorship initiative",
    description: "Create a structured mentorship program connecting at-risk youth with professionals in various fields to provide guidance, career exposure, and positive role models.",
    category: "social",
    status: "open",
    upvotes: 29,
  },
  {
    title: "Affordable housing solutions",
    description: "Develop innovative approaches to address the housing affordability crisis in our community, including cooperative housing models, tiny home communities, and adaptive reuse of existing buildings.",
    category: "housing",
    status: "open",
    upvotes: 45,
  },
  {
    title: "Renewable energy adoption",
    description: "Accelerate the transition to renewable energy sources in our community through solar panel installations, wind energy projects, and community education programs about sustainable energy practices.",
    category: "environment",
    status: "open",
    upvotes: 40,
  },
  {
    title: "Mental health support network",
    description: "Build a comprehensive mental health support system that includes peer support groups, crisis intervention services, and partnerships with local mental health professionals.",
    category: "health",
    status: "open",
    upvotes: 37,
  },
  {
    title: "Small business revitalization",
    description: "Support local small businesses through technical assistance, marketing support, access to capital, and community engagement initiatives to strengthen the local economy.",
    category: "economic",
    status: "open",
    upvotes: 33,
  },
  {
    title: "Accessible public spaces",
    description: "Audit and improve accessibility of public spaces including parks, sidewalks, public buildings, and transportation hubs to ensure full inclusion for people with disabilities.",
    category: "infrastructure",
    status: "open",
    upvotes: 28,
  },
];

// Demo Pitches
const demoPitches = [
  {
    title: "Smart Transit App",
    description: "A mobile application providing real-time public transit information, route optimization, and crowd-sourced delay reporting.",
    problem_id: null, // Will be set after problems are created
  },
  {
    title: "Food Rescue Platform",
    description: "A digital platform connecting restaurants with surplus food to local shelters and food banks, with automated matching and logistics coordination.",
    problem_id: null,
  },
  {
    title: "Senior Tech Academy",
    description: "A comprehensive digital literacy program for seniors featuring hands-on workshops, one-on-one coaching, and peer learning circles.",
    problem_id: null,
  },
  {
    title: "Green Spaces Initiative",
    description: "A community-driven project to transform vacant lots into productive gardens and gathering spaces with sustainable practices.",
    problem_id: null,
  },
  {
    title: "Pathways to Success",
    description: "A youth mentorship program matching students with professionals in their fields of interest, providing career guidance and skill development.",
    problem_id: null,
  },
];

// Demo Projects
const demoProjects = [
  {
    title: "Transit Optimization Pilot",
    description: "A pilot program testing smart transit solutions in downtown area with real-time tracking and route optimization.",
    status: "active",
  },
  {
    title: "Community Food Network",
    description: "Building a network of restaurants, shelters, and volunteers to redistribute surplus food efficiently.",
    status: "active",
  },
  {
    title: "Digital Inclusion Hub",
    description: "Creating a central hub for digital literacy programs with dedicated facilities and trained instructors.",
    status: "planning",
  },
  {
    title: "Urban Garden Collective",
    description: "Establishing a network of community gardens across the city with shared resources and knowledge.",
    status: "planning",
  },
  {
    title: "Youth Leadership Academy",
    description: "A comprehensive program developing leadership skills in young adults through mentorship and hands-on projects.",
    status: "active",
  },
];

async function seedDemoData() {
  console.log('Starting demo data seeding...');

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated. Please login first.');
      return;
    }

    console.log(`Seeding data for user: ${user.email}`);

    // Seed Problems
    console.log('\n📝 Seeding problems...');
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .insert(demoProblems.map(p => ({
        ...p,
        created_by: user.id,
      })))
      .select();

    if (problemsError) {
      console.error('Error seeding problems:', problemsError);
      return;
    }

    console.log(`✅ Created ${problems?.length || 0} problems`);

    // Seed Pitches
    console.log('\n🎯 Seeding pitches...');
    const pitchesWithProblemIds = demoPitches.map((pitch, index) => ({
      ...pitch,
      problem_id: problems?.[index % (problems?.length || 1)]?.id || null,
      created_by: user.id,
    }));

    const { data: pitches, error: pitchesError } = await supabase
      .from('pitches')
      .insert(pitchesWithProblemIds)
      .select();

    if (pitchesError) {
      console.error('Error seeding pitches:', pitchesError);
      return;
    }

    console.log(`✅ Created ${pitches?.length || 0} pitches`);

    // Seed Projects
    console.log('\n🚀 Seeding projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert(demoProjects.map(p => ({
        ...p,
        created_by: user.id,
      })))
      .select();

    if (projectsError) {
      console.error('Error seeding projects:', projectsError);
      return;
    }

    console.log(`✅ Created ${projects?.length || 0} projects`);

    // Add current user as leader to projects
    console.log('\n👥 Adding user as project leader...');
    for (const project of projects || []) {
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'leader',
          name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Demo User',
          email: user.email || '',
        });

      if (memberError) {
        console.error(`Error adding member to project ${project.id}:`, memberError);
      }
    }

    console.log(`✅ Added user as leader to ${projects?.length || 0} projects`);

    console.log('\n🎉 Demo data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Problems: ${problems?.length || 0}`);
    console.log(`- Pitches: ${pitches?.length || 0}`);
    console.log(`- Projects: ${projects?.length || 0}`);

  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

// Run the seeding
seedDemoData();
