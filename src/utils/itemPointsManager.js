import { supabase } from '../supabase';

// Add points to a specific item
export const addItemPoints = async (userId, cvId, sectionName, itemIndex, points, reason = 'Admin adjustment') => {
  try {
    console.log('Adding item points:', { userId, cvId, sectionName, itemIndex, points, reason });
    
    // First, check if a record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('item_points')
      .select('*')
      .eq('user_id', userId)
      .eq('cv_id', cvId)
      .eq('section_name', sectionName)
      .eq('item_index', itemIndex)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing record:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    // eslint-disable-next-line no-unused-vars
    let result;
    if (existingRecord) {
      // Update existing record - preserve item_data
      const { error: updateError } = await supabase
        .from('item_points')
        .update({
          points: existingRecord.points + points,
          reason: reason,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
          // Don't update item_data - keep the existing one
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Error updating item points:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      } else {
        console.log('Successfully updated existing points in database');
      }
    } else {
      // Create new record - we need to get the item data from the CV
      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
        .single();

      if (cvError) {
        console.error('Error fetching CV data:', cvError);
        throw new Error(`Database error: ${cvError.message}`);
      }

      // Extract the item data from the CV
      let itemData = null;
      if (cvData[sectionName] && Array.isArray(cvData[sectionName]) && cvData[sectionName][itemIndex]) {
        itemData = cvData[sectionName][itemIndex];
      }

      const { error: insertError } = await supabase
        .from('item_points')
        .insert({
          user_id: userId,
          cv_id: cvId,
          section_name: sectionName,
          item_index: itemIndex,
          item_data: itemData, // Include the actual item data
          points: points,
          reason: reason,
          admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) {
        console.error('Error inserting item points:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      } else {
        console.log('Successfully added new points to database');
      }
    }

    // Add to history
    const { error: historyError } = await supabase
      .from('item_points_history')
      .insert({
        user_id: userId,
        cv_id: cvId,
        section_name: sectionName,
        item_index: itemIndex,
        points_change: points,
        reason: reason,
        admin_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (historyError) {
      console.error('Error adding to history:', historyError);
      // Don't throw here as the main operation succeeded
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding item points:', error);
    throw error;
  }
};

// Subtract points from a specific item
export const subtractItemPoints = async (userId, cvId, sectionName, itemIndex, points, reason = 'Admin adjustment') => {
  try {
    console.log('Subtracting item points:', { userId, cvId, sectionName, itemIndex, points, reason });
    
    // First, check if a record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('item_points')
      .select('*')
      .eq('user_id', userId)
      .eq('cv_id', cvId)
      .eq('section_name', sectionName)
      .eq('item_index', itemIndex)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing record:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    // eslint-disable-next-line no-unused-vars
    let result;
    if (existingRecord) {
      // Update existing record - preserve item_data
      const { error: updateError } = await supabase
        .from('item_points')
        .update({
          points: existingRecord.points - points,
          reason: reason,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
          // Don't update item_data - keep the existing one
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Error updating item points:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      } else {
        console.log('Successfully updated existing points in database');
      }
    } else {
      // Create new record with negative points - we need to get the item data from the CV
      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
        .single();

      if (cvError) {
        console.error('Error fetching CV data:', cvError);
        throw new Error(`Database error: ${cvError.message}`);
      }

      // Extract the item data from the CV
      let itemData = null;
      if (cvData[sectionName] && Array.isArray(cvData[sectionName]) && cvData[sectionName][itemIndex]) {
        itemData = cvData[sectionName][itemIndex];
      }

      const { error: insertError } = await supabase
        .from('item_points')
        .insert({
          user_id: userId,
          cv_id: cvId,
          section_name: sectionName,
          item_index: itemIndex,
          item_data: itemData, // Include the actual item data
          points: -points,
          reason: reason,
          admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) {
        console.error('Error inserting item points:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      } else {
        console.log('Successfully added new negative points to database');
      }
    }

    // Add to history
    const { error: historyError } = await supabase
      .from('item_points_history')
      .insert({
        user_id: userId,
        cv_id: cvId,
        section_name: sectionName,
        item_index: itemIndex,
        points_change: -points,
        reason: reason,
        admin_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (historyError) {
      console.error('Error adding to history:', historyError);
      // Don't throw here as the main operation succeeded
    }

    return { success: true };
  } catch (error) {
    console.error('Error subtracting item points:', error);
    throw error;
  }
};

// Get all CVs with item points
export const getAllCVsWithItemPoints = async () => {
  try {
    // Get all CVs
    const { data: cvs, error: cvsError } = await supabase
      .from('cvs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (cvsError) {
      console.error('Error fetching CVs:', cvsError);
      return [];
    }

    // Get all item points
    const { data: itemPoints, error: pointsError } = await supabase
      .from('item_points')
      .select('*');

    if (pointsError) {
      console.error('Error fetching item points:', pointsError);
      return cvs.map(cv => ({ ...cv, total_points: 0 }));
    }

    // Calculate total points for each CV
    const cvPointsMap = {};
    itemPoints.forEach(point => {
      if (!cvPointsMap[point.cv_id]) {
        cvPointsMap[point.cv_id] = 0;
      }
      cvPointsMap[point.cv_id] += point.points;
    });

    return cvs.map(cv => ({
      cv_id: cv.id,
      user_id: cv.user_id,
      full_name: cv.full_name,
      email: cv.email,
      total_points: cvPointsMap[cv.id] || 0,
      updated_at: cv.updated_at
    }));
  } catch (error) {
    console.error('Error fetching CVs with item points:', error);
    return [];
  }
};

// Get specific CV with item points
export const getCVWithItemPoints = async (cvId) => {
  try {
    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .single();

    if (cvError) {
      console.error('Error fetching CV:', cvError);
      return null;
    }

    const { data: itemPoints, error: pointsError } = await supabase
      .from('item_points')
      .select('*')
      .eq('cv_id', cvId);

    if (pointsError) {
      console.error('Error fetching item points:', pointsError);
      return { ...cv, total_points: 0 };
    }

    const totalPoints = itemPoints.reduce((sum, point) => sum + point.points, 0);

    return {
      cv_id: cv.id,
      user_id: cv.user_id,
      full_name: cv.full_name,
      email: cv.email,
      total_points: totalPoints,
      updated_at: cv.updated_at
    };
  } catch (error) {
    console.error('Error fetching CV with item points:', error);
    return null;
  }
};

// Get items with points for a specific CV
export const getCVItemsWithPoints = async (cvId) => {
  try {
    const { data, error } = await supabase
      .from('item_points')
      .select('*')
      .eq('cv_id', cvId)
      .order('section_name')
      .order('item_index');

    if (error) {
      console.error('Error fetching CV items with points:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching CV items with points:', error);
    return [];
  }
};

// Get item points history for a specific CV
export const getItemPointsHistory = async (cvId) => {
  try {
    const { data, error } = await supabase
      .from('item_points_history')
      .select('*')
      .eq('cv_id', cvId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching item points history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching item points history:', error);
    return [];
  }
};

// Index-based points configuration (stored in a dedicated table)
// Table: index_points_config { id serial, index_name text primary key, points int }
// Default indices: SSCI, SCOPUS, KCI, Other
export const getIndexPointsConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('index_points_config')
      .select('index_name, points');
    if (error) {
      console.error('Error fetching index points config:', error);
      return { SSCI: 0, SCOPUS: 0, KCI: 0, Other: 0 };
    }
    const map = { SSCI: 0, SCOPUS: 0, KCI: 0, Other: 0 };
    (data || []).forEach((row) => {
      if (row.index_name && typeof row.points === 'number') {
        map[row.index_name] = row.points;
      }
    });
    return map;
  } catch (e) {
    console.error('Exception fetching index points config:', e);
    return { SSCI: 0, SCOPUS: 0, KCI: 0, Other: 0 };
  }
};

export const setIndexPointsConfig = async (indexName, points) => {
  try {
    const { error } = await supabase
      .from('index_points_config')
      .upsert({ index_name: indexName, points });
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('Error updating index points config:', e);
    return { success: false, error: e };
  }
};

// Helper: set or replace points for a specific publication item based on index selection
export const setPublicationIndexPoints = async ({ userId, cvId, itemIndex, indexName }) => {
  try {
    // Read configured points
    const config = await getIndexPointsConfig();
    const targetPoints = config[indexName] ?? 0;

    // Ensure we have the current CV to capture item_data
    const { data: cv, error: cvErr } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .single();
    if (cvErr) throw cvErr;

    const itemData = Array.isArray(cv.publications_research) ? cv.publications_research[itemIndex] : null;

    // Upsert into item_points with absolute points (replace existing value)
    const { data: existing, error: getErr } = await supabase
      .from('item_points')
      .select('*')
      .eq('user_id', userId)
      .eq('cv_id', cvId)
      .eq('section_name', 'publications_research')
      .eq('item_index', itemIndex)
      .maybeSingle();
    if (getErr && getErr.code !== 'PGRST116') throw getErr;

    if (existing) {
      const { error: updErr } = await supabase
        .from('item_points')
        .update({ points: targetPoints, reason: `Index: ${indexName}`, item_data: itemData })
        .eq('id', existing.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase
        .from('item_points')
        .insert({
          user_id: userId,
          cv_id: cvId,
          section_name: 'publications_research',
          item_index: itemIndex,
          item_data: itemData,
          points: targetPoints,
          reason: `Index: ${indexName}`,
        });
      if (insErr) throw insErr;
    }

    // Add to history as a replacement (use delta = target - previous)
    // Fetch latest after update
    const { data: afterRec, error: afterErr } = await supabase
      .from('item_points')
      .select('*')
      .eq('user_id', userId)
      .eq('cv_id', cvId)
      .eq('section_name', 'publications_research')
      .eq('item_index', itemIndex)
      .single();
    if (afterErr) throw afterErr;

    const delta = targetPoints - ((existing?.points) ?? 0);
    if (delta !== 0) {
      const { error: histErr } = await supabase
        .from('item_points_history')
        .insert({
          user_id: userId,
          cv_id: cvId,
          section_name: 'publications_research',
          item_index: itemIndex,
          points_change: delta,
          reason: `Index set to ${indexName}`,
        });
      if (histErr) console.error('Error adding index points history:', histErr);
    }

    return { success: true, points: afterRec.points };
  } catch (e) {
    console.error('Error setting publication index points:', e);
    return { success: false, error: e };
  }
};

// Recalculate points for all publications based on current index_points_config
export const recalcAllPublicationIndexPoints = async () => {
  try {
    const config = await getIndexPointsConfig();

    // Fetch all item_points for publications
    const { data: allPoints, error: ptsErr } = await supabase
      .from('item_points')
      .select('*')
      .eq('section_name', 'publications_research');
    if (ptsErr) throw ptsErr;

    let updated = 0;
    for (const row of allPoints || []) {
      // Derive index from stored item_data, else look up from cvs
      let indexName = row.item_data?.index;
      if (!indexName) {
        const { data: cv, error: cvErr } = await supabase
          .from('cvs')
          .select('publications_research')
          .eq('id', row.cv_id)
          .single();
        if (!cvErr && Array.isArray(cv?.publications_research)) {
          indexName = cv.publications_research[row.item_index]?.index;
        }
      }
      const target = config[indexName] ?? config['Other'] ?? 0;
      if (typeof target !== 'number') continue;

      const current = row.points || 0;
      if (current === target) continue;

      // Update item_points
      const { error: updErr } = await supabase
        .from('item_points')
        .update({ points: target, reason: `Index recalculation (${indexName || 'Other'})` })
        .eq('id', row.id);
      if (updErr) continue;

      // Add history delta
      const delta = target - current;
      const { error: histErr } = await supabase
        .from('item_points_history')
        .insert({
          user_id: row.user_id,
          cv_id: row.cv_id,
          section_name: 'publications_research',
          item_index: row.item_index,
          points_change: delta,
          reason: 'Index config recalculation'
        });
      if (histErr) {
        // Non-blocking
      }
      updated += 1;
    }

    return { success: true, updated };
  } catch (e) {
    console.error('Error recalculating publication index points:', e);
    return { success: false, error: e };
  }
};

// Section names mapping for display
export const SECTION_NAMES = {
  education: 'Education',
  academic_employment: 'Employment History',
  teaching: 'Teaching',
  courses: 'Courses (Credit Hours)',
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

// Get item display text based on section and item data
export const getItemDisplayText = (sectionName, itemData) => {
  if (!itemData) return 'Unknown item';
  
  switch (sectionName) {
    case 'education':
      return `${itemData.degree || 'Degree'} - ${itemData.institution || 'Institution'}`;
    case 'academic_employment':
      return `${itemData.position || 'Position'} at ${itemData.institution || 'Institution'}`;
    case 'teaching':
      return `${itemData.course || 'Course'} - ${itemData.institution || 'Institution'}`;
    case 'courses':
      const creditHours = itemData.credit_hours ? ` (${itemData.credit_hours} credits)` : '';
      return `${itemData.course || 'Course'} - ${itemData.institution || 'Institution'}${creditHours}`;
    case 'publications_research':
      const indexText = itemData.index ? ` (${itemData.index})` : '';
      return `${itemData.title || 'Research Publication'}${indexText}`;
    case 'publications_books':
      return itemData.title || 'Book Publication';
    case 'conference_presentations':
      return itemData.title || 'Conference Presentation';
    case 'professional_service':
      return itemData.role || 'Professional Service';
    case 'internal_activities':
      return `${itemData.position_type || 'Service Type'} - ${itemData.details || 'Details'}`;
    default:
      return JSON.stringify(itemData).substring(0, 50) + '...';
  }
};

// Calculate Intellectual Score (Research Publications + Books + Education + Conference Presentations)
export const calculateIntellectualScore = (itemPoints) => {
  if (!itemPoints || !Array.isArray(itemPoints)) return 0;
  
  return itemPoints
    .filter(item => ['publications_research', 'publications_books', 'education', 'conference_presentations'].includes(item.section_name))
    .reduce((sum, item) => sum + (item.points || 0), 0);
};

// Calculate Professional Score (Teaching + Professional Service + Internal Activities)
export const calculateProfessionalScore = (itemPoints) => {
  if (!itemPoints || !Array.isArray(itemPoints)) return 0;
  
  return itemPoints
    .filter(item => ['teaching', 'professional_service', 'internal_activities'].includes(item.section_name))
    .reduce((sum, item) => sum + (item.points || 0), 0);
};

// Calculate Course Score (from courses section - 1 credit hour = 1 point)
// Optionally includes bonus points from item_points table
export const calculateCourseScore = (cv, itemPoints = []) => {
  let score = 0;
  
  // Add credit hours from courses array
  if (cv && cv.courses && Array.isArray(cv.courses)) {
    score += cv.courses.reduce((sum, course) => {
      const creditHours = parseFloat(course.credit_hours) || 0;
      return sum + creditHours;
    }, 0);
  }
  
  // Add bonus points from item_points table for courses
  if (Array.isArray(itemPoints)) {
    const courseBonusPoints = itemPoints
      .filter(point => point.section_name === 'courses')
      .reduce((sum, point) => sum + (point.points || 0), 0);
    score += courseBonusPoints;
  }
  
  return score;
};

// Get all CVs with categorized scores
export const getAllCVsWithCategorizedScores = async () => {
  try {
    // Get all CVs
    const { data: cvs, error: cvsError } = await supabase
      .from('cvs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (cvsError) {
      console.error('Error fetching CVs:', cvsError);
      return [];
    }

    // Get all item points
    const { data: itemPoints, error: pointsError } = await supabase
      .from('item_points')
      .select('*');

    if (pointsError) {
      console.error('Error fetching item points:', pointsError);
      return cvs.map(cv => ({ 
        ...cv, 
        total_points: 0,
        intellectual_score: 0,
        professional_score: 0,
        course_score: 0
      }));
    }

    // Calculate scores for each CV
    const cvPointsMap = {};
    const cvIntellectualMap = {};
    const cvProfessionalMap = {};
    const cvCourseMap = {};

    itemPoints.forEach(point => {
      const cvId = point.cv_id;
      
      // Skip course points here - they'll be added via calculateCourseScore
      // This prevents double counting since course points are included in course score
      if (point.section_name === 'courses') {
        return;
      }
      
      // Total points (excluding courses - they're added separately)
      if (!cvPointsMap[cvId]) {
        cvPointsMap[cvId] = 0;
      }
      cvPointsMap[cvId] += point.points;

      // Intellectual score
      if (['publications_research', 'publications_books', 'education', 'conference_presentations'].includes(point.section_name)) {
        if (!cvIntellectualMap[cvId]) {
          cvIntellectualMap[cvId] = 0;
        }
        cvIntellectualMap[cvId] += point.points;
      }

      // Professional score
      if (['teaching', 'professional_service', 'internal_activities'].includes(point.section_name)) {
        if (!cvProfessionalMap[cvId]) {
          cvProfessionalMap[cvId] = 0;
        }
        cvProfessionalMap[cvId] += point.points;
      }
    });

    // Calculate course scores from CV data (credit hours + bonus points from item_points)
    cvs.forEach(cv => {
      const cvItemPoints = itemPoints.filter(p => p.cv_id === cv.id);
      cvCourseMap[cv.id] = calculateCourseScore(cv, cvItemPoints);
      // Add course score to total points
      if (!cvPointsMap[cv.id]) {
        cvPointsMap[cv.id] = 0;
      }
      cvPointsMap[cv.id] += cvCourseMap[cv.id];
    });

    return cvs.map(cv => ({
      cv_id: cv.id,
      user_id: cv.user_id,
      full_name: cv.full_name,
      email: cv.email,
      total_points: cvPointsMap[cv.id] || 0,
      intellectual_score: cvIntellectualMap[cv.id] || 0,
      professional_score: cvProfessionalMap[cv.id] || 0,
      course_score: cvCourseMap[cv.id] || 0,
      updated_at: cv.updated_at
    }));
  } catch (error) {
    console.error('Error fetching CVs with categorized scores:', error);
    return [];
  }
};

// Get all users with their CV status
export const getAllUsersWithCVStatus = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_users_with_cv_status');

    if (error) {
      console.error('Error fetching users with CV status:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users with CV status:', error);
    return [];
  }
};

// Filter CV data by year range
export const filterCVByYear = (cv, yearFilter) => {
  if (!yearFilter.from && !yearFilter.to) {
    return cv; // No filter applied
  }

  const filteredCV = { ...cv };
  const fromYear = yearFilter.from ? parseInt(yearFilter.from) : 0;
  const toYear = yearFilter.to ? parseInt(yearFilter.to) : 9999;

  // Helper function to check if a year is within range
  const isYearInRange = (year) => {
    const yearInt = parseInt(year);
    return !isNaN(yearInt) && yearInt >= fromYear && yearInt <= toYear;
  };

  // Helper function to check if a date range overlaps with filter range
  const isDateRangeInFilter = (startDate, endDate) => {
    if (!startDate) return false;
    
    // Extract year from start date (format: "May 2024" or "2024")
    const startYear = parseInt(startDate.toString().match(/\d{4}/)?.[0]);
    if (isNaN(startYear)) return false;
    
    // If no end date, check if start year is in range
    if (!endDate || endDate === 'Present') {
      return isYearInRange(startYear);
    }
    
    // Extract year from end date
    const endYear = parseInt(endDate.toString().match(/\d{4}/)?.[0]);
    if (isNaN(endYear)) return false;
    
    // Check if the date range overlaps with filter range
    // An item should show if ANY part of its date range overlaps with the filter range
    return (startYear <= toYear && endYear >= fromYear);
  };

  // Helper function to filter array items by year/date range
  const filterByYear = (items, startField = 'year', endField = null) => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(item => {
      const startDate = item[startField];
      const endDate = endField ? item[endField] : null;
      
      return isDateRangeInFilter(startDate, endDate);
    });
  };

  // Filter each section (education is always included)
  filteredCV.education = cv.education || []; // Education is always shown regardless of year filter
  filteredCV.academic_employment = filterByYear(cv.academic_employment, 'start_date', 'end_date');
  filteredCV.teaching = filterByYear(cv.teaching);
  filteredCV.courses = filterByYear(cv.courses);
  filteredCV.publications_research = filterByYear(cv.publications_research);
  filteredCV.publications_books = filterByYear(cv.publications_books);
  filteredCV.conference_presentations = filterByYear(cv.conference_presentations);
  filteredCV.professional_service = filterByYear(cv.professional_service);
  filteredCV.internal_activities = filterByYear(cv.internal_activities);

  return filteredCV;
};

// Calculate points for filtered CV data
export const calculateFilteredPoints = (cv, itemPoints, yearFilter) => {
  if (!yearFilter.from && !yearFilter.to) {
    // No filter, return original points
    const courseItemPoints = itemPoints.filter(p => p.section_name === 'courses');
    const courseScore = calculateCourseScore(cv, courseItemPoints);
    // Calculate item points total excluding course points (since they're in courseScore)
    const nonCourseItemPoints = itemPoints.filter(p => p.section_name !== 'courses');
    const itemPointsTotal = nonCourseItemPoints.reduce((sum, point) => sum + point.points, 0);
    return {
      total_points: itemPointsTotal + courseScore,
      intellectual_score: calculateIntellectualScore(itemPoints),
      professional_score: calculateProfessionalScore(itemPoints),
      course_score: courseScore
    };
  }

  const fromYear = yearFilter.from ? parseInt(yearFilter.from) : 0;
  const toYear = yearFilter.to ? parseInt(yearFilter.to) : 9999;

  // Helper function to check if a date range overlaps with filter range
  const isDateRangeInFilter = (startDate, endDate) => {
    if (!startDate) return false;
    
    // Extract year from start date (format: "May 2024" or "2024")
    const startYear = parseInt(startDate.toString().match(/\d{4}/)?.[0]);
    if (isNaN(startYear)) return false;
    
    // If no end date, check if start year is in range
    if (!endDate || endDate === 'Present') {
      return startYear >= fromYear && startYear <= toYear;
    }
    
    // Extract year from end date
    const endYear = parseInt(endDate.toString().match(/\d{4}/)?.[0]);
    if (isNaN(endYear)) return false;
    
    // Check if the date range overlaps with filter range
    return (startYear <= toYear && endYear >= fromYear);
  };

  // Filter item points based on the CV data year filtering
  const filteredItemPoints = itemPoints.filter(point => {
    // Get the corresponding item from CV data
    const cvSection = cv[point.section_name];
    if (!cvSection || !Array.isArray(cvSection)) return false;
    
    const item = cvSection[point.item_index];
    if (!item) return false;

    // Education is always included regardless of year filter
    if (point.section_name === 'education') {
      return true;
    }

    // Check date range based on section type
    switch (point.section_name) {
      case 'academic_employment':
        return isDateRangeInFilter(item.start_date, item.end_date);
      default:
        return isDateRangeInFilter(item.year, null);
    }
  });

  // Calculate course score from filtered CV data (credit hours + bonus points)
  const filteredCV = filterCVByYear(cv, yearFilter);
  // Filter course item points by year
  const courseItemPoints = filteredItemPoints.filter(p => p.section_name === 'courses');
  const courseScore = calculateCourseScore(filteredCV, courseItemPoints);

  // Calculate item points total excluding course points (since they're in courseScore)
  const nonCourseFilteredItemPoints = filteredItemPoints.filter(p => p.section_name !== 'courses');
  const itemPointsTotal = nonCourseFilteredItemPoints.reduce((sum, point) => sum + point.points, 0);
  const totalPoints = itemPointsTotal + courseScore;

  return {
    total_points: totalPoints,
    intellectual_score: calculateIntellectualScore(filteredItemPoints),
    professional_score: calculateProfessionalScore(filteredItemPoints),
    course_score: courseScore
  };
}; 

// Get points for a specific user
export const getUserItemPoints = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('item_points')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user item points:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user item points:', error);
    throw error;
  }
};

// Calculate total points for a user from item_points
export const calculateUserTotalPoints = async (userId) => {
  try {
    console.log('calculateUserTotalPoints called for user:', userId)
    const itemPoints = await getUserItemPoints(userId)
    console.log('Retrieved item points:', itemPoints)
    
    // Get CV data to calculate course score
    const { data: cvData, error: cvError } = await supabase
      .from('cvs')
      .select('courses')
      .eq('user_id', userId)
      .single()
    
    const cv = cvError ? null : cvData
    
    // Calculate intellectual score (research, books, education, conferences)
    const intellectualPoints = itemPoints
      .filter(point => ['publications_research', 'publications_books', 'education', 'conference_presentations'].includes(point.section_name))
      .reduce((sum, point) => sum + point.points, 0)
    
    // Calculate professional score (teaching, professional_service, internal_activities)
    const professionalPoints = itemPoints
      .filter(point => ['teaching', 'professional_service', 'internal_activities'].includes(point.section_name))
      .reduce((sum, point) => sum + point.points, 0)
    
    // Calculate course score (from credit hours + bonus points from item_points)
    const courseItemPoints = itemPoints.filter(p => p.section_name === 'courses');
    const coursePoints = calculateCourseScore(cv, courseItemPoints)
    
    const totalPoints = intellectualPoints + professionalPoints + coursePoints
    
    console.log('Calculated scores:', { total: totalPoints, intellectual: intellectualPoints, professional: professionalPoints, course: coursePoints })
    
    return {
      total: totalPoints,
      intellectual: intellectualPoints,
      professional: professionalPoints,
      course: coursePoints
    }
  } catch (error) {
    console.error('Error calculating user total points:', error)
    return {
      total: 0,
      intellectual: 0,
      professional: 0,
      course: 0
    }
  }
}; 