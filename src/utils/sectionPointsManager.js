import { supabase } from '../supabase';

// Check if section points functions exist
export const checkSectionPointsFunctions = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_cvs_with_section_points');
    if (error) {
      console.error('Section points functions not found:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking section points functions:', error);
    return false;
  }
};

// Add points to a specific section
export const addSectionPoints = async (userId, cvId, sectionName, points, reason = 'Admin adjustment') => {
  try {
    console.log('Adding section points:', { userId, cvId, sectionName, points, reason });
    
    const { error } = await supabase.rpc('add_section_points_func', {
      target_user_id: userId,
      target_cv_id: cvId,
      section_name_param: sectionName,
      points_to_add: points,
      reason_param: reason
    });

    if (error) {
      console.error('Error adding section points:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding section points:', error);
    throw error;
  }
};

// Subtract points from a specific section
export const subtractSectionPoints = async (userId, cvId, sectionName, points, reason = 'Admin adjustment') => {
  try {
    console.log('Subtracting section points:', { userId, cvId, sectionName, points, reason });
    
    const { error } = await supabase.rpc('subtract_section_points_func', {
      target_user_id: userId,
      target_cv_id: cvId,
      section_name_param: sectionName,
      points_to_subtract: points,
      reason_param: reason
    });

    if (error) {
      console.error('Error subtracting section points:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error subtracting section points:', error);
    throw error;
  }
};

// Get all CVs with section points
export const getAllCVsWithSectionPoints = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_cvs_with_section_points_func');

    if (error) {
      console.error('Error fetching CVs with section points:', error);
      // If the function doesn't exist, return empty array instead of throwing
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        console.log('Section points functions not set up yet');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching CVs with section points:', error);
    return [];
  }
};

// Get specific CV with section points
export const getCVWithSectionPoints = async (cvId) => {
  try {
    const { data, error } = await supabase.rpc('get_cv_with_section_points', {
      cv_id_param: cvId
    });

    if (error) {
      console.error('Error fetching CV with section points:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching CV with section points:', error);
    return null;
  }
};

// Get section points history for a specific CV
export const getSectionPointsHistory = async (cvId) => {
  try {
    const { data, error } = await supabase
      .from('section_points_history')
      .select('*')
      .eq('cv_id', cvId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching section points history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching section points history:', error);
    return [];
  }
};

// Section names mapping for display
export const SECTION_NAMES = {
  education: 'Education',
  academic_employment: 'Academic Employment',
  teaching: 'Teaching',
  publications_research: 'Publications (Research)',
  publications_books: 'Publications (Books)',
  conference_presentations: 'Conference Presentations',
  professional_service: 'Professional Service',
  internal_activities: 'Internal Activities at Gachon'
};

// Get section display name
export const getSectionDisplayName = (sectionName) => {
  return SECTION_NAMES[sectionName] || sectionName;
}; 