import { supabase } from './client';

export type Occupation = 'student' | 'working' | 'both' | 'other';

export interface Profile {
  id: string;
  display_name: string;
  birthdate: string;
  pronouns: string | null;
  bio: string | null;
  photos: string[];
  occupation: Occupation;
  school_or_employer: string | null;
  verified_email: boolean;
  last_active_at: string;
  created_at: string;
}

export type SmokingLevel = 'none' | 'outdoor_ok' | 'indoor';
export type DrinkingLevel = 'none' | 'social' | 'frequent';
export type PetsOwned = 'none' | 'cat' | 'dog' | 'other';
export type PetsOkWith = 'any' | 'cats_only' | 'dogs_only' | 'none' | 'allergic';
export type KitchenSharing = 'share_everything' | 'share_space_not_food' | 'separate';

export interface Lifestyle {
  profile_id: string;
  sleep_schedule: number;
  cleanliness: number;
  noise_tolerance: number;
  guest_frequency: number;
  sociability: number;
  wfh_days: number;
  smoking: SmokingLevel;
  cannabis: SmokingLevel;
  drinking: DrinkingLevel;
  pets_owned: PetsOwned;
  pets_ok_with: PetsOkWith;
  kitchen_sharing: KitchenSharing;
  dealbreakers: string[];
}

export type HousingRole = 'has_place' | 'needs_place' | 'forming_group';

export interface HousingIntent {
  profile_id: string;
  role: HousingRole;
  budget_min: number;
  budget_max: number;
  move_in_earliest: string;
  move_in_latest: string;
  lease_months: number | null;
  city: string;
  neighbourhoods: string[];
  anchor_lat: number | null;
  anchor_lng: number | null;
  max_commute_minutes: number | null;
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function getLifestyle(profileId: string): Promise<Lifestyle | null> {
  const { data, error } = await supabase
    .from('lifestyle')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertLifestyle(
  lifestyle: Partial<Lifestyle> & { profile_id: string }
): Promise<Lifestyle> {
  const { data, error } = await supabase.from('lifestyle').upsert(lifestyle).select().single();
  if (error) throw error;
  return data;
}

export async function getHousingIntent(profileId: string): Promise<HousingIntent | null> {
  const { data, error } = await supabase
    .from('housing_intent')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertHousingIntent(
  intent: Partial<HousingIntent> & { profile_id: string }
): Promise<HousingIntent> {
  const { data, error } = await supabase.from('housing_intent').upsert(intent).select().single();
  if (error) throw error;
  return data;
}
