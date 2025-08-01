import { supabase } from '../supabase';

// Add points to a user
export const addPoints = async (userId, points, reason = 'Admin adjustment') => {
  try {
    const { error } = await supabase.rpc('add_user_points', {
      target_user_id: userId,
      points_to_add: points,
      reason: reason
    });

    if (error) {
      console.error('Error adding points:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

// Subtract points from a user
export const subtractPoints = async (userId, points, reason = 'Admin adjustment') => {
  try {
    const { error } = await supabase.rpc('subtract_user_points', {
      target_user_id: userId,
      points_to_subtract: points,
      reason: reason
    });

    if (error) {
      console.error('Error subtracting points:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error subtracting points:', error);
    throw error;
  }
};

// Get all users with their points
export const getUsersWithPoints = async () => {
  try {
    const { data, error } = await supabase.rpc('get_users_with_points');

    if (error) {
      console.error('Error fetching users with points:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users with points:', error);
    throw error;
  }
};

// Get points history for a specific user
export const getPointsHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching points history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching points history:', error);
    throw error;
  }
};

// Get current points for a specific user
export const getUserPoints = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user points:', error);
      throw error;
    }

    return data?.points || 0;
  } catch (error) {
    console.error('Error fetching user points:', error);
    throw error;
  }
}; 