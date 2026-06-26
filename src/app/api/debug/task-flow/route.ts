import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, title, description, assignedEmail, dueDate, priority } = body;
    if (!projectId || !title) return NextResponse.json({ error: "projectId and title required" }, { status: 400 });

    const supabase = await createClient();

    console.log('[debug/task-flow] Received payload:', { projectId, title, description, assignedEmail, dueDate, priority });

    // Resolve email -> profile
    let assignedToUserId: string | null = null;
    let assignedUserDisplay: string | null = null;

    if (assignedEmail) {
      const email = assignedEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }

      const { data: assigneeProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .ilike('email', email)
        .maybeSingle();

      console.log('[debug/task-flow] Profile lookup:', { assigneeProfile, profileError });

      if (profileError || !assigneeProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      // Verify project membership
      const { data: membership, error: membershipError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', assigneeProfile.id)
        .maybeSingle();

      console.log('[debug/task-flow] Membership lookup:', { membership, membershipError });

      if (membershipError || !membership) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      }

      assignedToUserId = assigneeProfile.id;
      assignedUserDisplay = assigneeProfile.display_name || assigneeProfile.email;
    }

    const insertPayload: Record<string, any> = {
      project_id: projectId,
      title,
      description: description || null,
      status: 'todo',
      priority: priority || 'medium',
      assigned_user: assignedUserDisplay || null,
      assigned_to: assignedToUserId,
      due_date: dueDate || null,
    };

    console.log('[debug/task-flow] Insert payload:', insertPayload);

    const { data: insertedTask, error: insertError } = await supabase
      .from('tasks')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    console.log('[debug/task-flow] Insert result:', { insertedTask, insertError });

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // Fetch tasks for project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, assigned_to, assigned_user, due_date, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    console.log('[debug/task-flow] Fetched tasks:', { count: (tasks || []).length, tasks, tasksError });

    if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      insertedTask,
      tasksCount: (tasks || []).length,
      tasks,
    });
  } catch (err: any) {
    console.error('[debug/task-flow] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
