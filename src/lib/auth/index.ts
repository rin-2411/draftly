"use server";

import { createClient } from "@/config/supabase/server";
import { redirect } from "next/navigation";

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Redirect handled by middleware after successful sign in
  return { data, error: null };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/login");
}

/**
 * Get the current user session
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return { session: null, error: error.message };
  }

  return { session, error: null };
}

/**
 * Get the current user
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user, error: null };
}
