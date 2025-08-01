// CV History Archive Manager
// This utility handles archiving old CV history versions to maintain performance

import { supabase } from '../supabase'

// Archive configuration
const ARCHIVE_CONFIG = {
  // Keep recent versions in main table (last 50 versions per CV)
  KEEP_RECENT_VERSIONS: 50,
  
  // Archive versions older than X days
  ARCHIVE_AFTER_DAYS: 365, // 1 year
  
  // Batch size for archiving operations
  BATCH_SIZE: 100
}

// Create archive table if it doesn't exist
export const createArchiveTable = async () => {
  try {
    const { error } = await supabase.rpc('create_cv_history_archive', {})
    
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating archive table:', error)
      throw error
    }
    
    console.log('Archive table ready')
    return true
  } catch (error) {
    console.error('Failed to create archive table:', error)
    return false
  }
}

// Get CVs that have too many history versions
export const getCVsForArchiving = async () => {
  try {
    const { data, error } = await supabase
      .from('cv_history')
      .select('cv_id, COUNT(*) as version_count')
      .group('cv_id')
      .gte('version_count', ARCHIVE_CONFIG.KEEP_RECENT_VERSIONS)
    
    if (error) {
      console.error('Error getting CVs for archiving:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Failed to get CVs for archiving:', error)
    return []
  }
}

// Archive old versions for a specific CV
export const archiveOldVersions = async (cvId) => {
  try {
    // Get the most recent versions to keep
    const { data: recentVersions, error: recentError } = await supabase
      .from('cv_history')
      .select('version_number')
      .eq('cv_id', cvId)
      .order('version_number', { ascending: false })
      .limit(ARCHIVE_CONFIG.KEEP_RECENT_VERSIONS)
    
    if (recentError) {
      console.error('Error getting recent versions:', recentError)
      return { success: false, archived: 0 }
    }
    
    if (!recentVersions || recentVersions.length === 0) {
      return { success: true, archived: 0 }
    }
    
    // Get the cutoff version number
    const cutoffVersion = recentVersions[recentVersions.length - 1]?.version_number || 0
    
    // Get old versions to archive
    const { data: oldVersions, error: oldError } = await supabase
      .from('cv_history')
      .select('*')
      .eq('cv_id', cvId)
      .lt('version_number', cutoffVersion)
    
    if (oldError) {
      console.error('Error getting old versions:', oldError)
      return { success: false, archived: 0 }
    }
    
    if (!oldVersions || oldVersions.length === 0) {
      return { success: true, archived: 0 }
    }
    
    // Insert into archive table
    const { error: archiveError } = await supabase
      .from('cv_history_archive')
      .insert(oldVersions)
    
    if (archiveError) {
      console.error('Error inserting into archive:', archiveError)
      return { success: false, archived: 0 }
    }
    
    // Delete from main history table
    const { error: deleteError } = await supabase
      .from('cv_history')
      .delete()
      .eq('cv_id', cvId)
      .lt('version_number', cutoffVersion)
    
    if (deleteError) {
      console.error('Error deleting old versions:', deleteError)
      return { success: false, archived: 0 }
    }
    
    console.log(`Archived ${oldVersions.length} versions for CV ${cvId}`)
    return { success: true, archived: oldVersions.length }
    
  } catch (error) {
    console.error('Failed to archive old versions:', error)
    return { success: false, archived: 0 }
  }
}

// Archive old versions by date
export const archiveByDate = async () => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_CONFIG.ARCHIVE_AFTER_DAYS)
    
    // Get old versions by date
    const { data: oldVersions, error } = await supabase
      .from('cv_history')
      .select('*')
      .lt('created_at', cutoffDate.toISOString())
      .limit(ARCHIVE_CONFIG.BATCH_SIZE)
    
    if (error) {
      console.error('Error getting old versions by date:', error)
      return { success: false, archived: 0 }
    }
    
    if (!oldVersions || oldVersions.length === 0) {
      return { success: true, archived: 0 }
    }
    
    // Insert into archive table
    const { error: archiveError } = await supabase
      .from('cv_history_archive')
      .insert(oldVersions)
    
    if (archiveError) {
      console.error('Error inserting into archive:', archiveError)
      return { success: false, archived: 0 }
    }
    
    // Delete from main history table
    const versionIds = oldVersions.map(v => v.id)
    const { error: deleteError } = await supabase
      .from('cv_history')
      .delete()
      .in('id', versionIds)
    
    if (deleteError) {
      console.error('Error deleting old versions:', deleteError)
      return { success: false, archived: 0 }
    }
    
    console.log(`Archived ${oldVersions.length} versions by date`)
    return { success: true, archived: oldVersions.length }
    
  } catch (error) {
    console.error('Failed to archive by date:', error)
    return { success: false, archived: 0 }
  }
}

// Run full archive process
export const runArchiveProcess = async () => {
  console.log('Starting archive process...')
  
  try {
    // Ensure archive table exists
    await createArchiveTable()
    
    let totalArchived = 0
    
    // Archive by version count
    const cvsForArchiving = await getCVsForArchiving()
    for (const cv of cvsForArchiving) {
      const result = await archiveOldVersions(cv.cv_id)
      if (result.success) {
        totalArchived += result.archived
      }
    }
    
    // Archive by date (in batches)
    let dateArchived = 0
    let batchResult
    do {
      batchResult = await archiveByDate()
      if (batchResult.success) {
        dateArchived += batchResult.archived
      }
    } while (batchResult.success && batchResult.archived > 0)
    
    totalArchived += dateArchived
    
    console.log(`Archive process completed. Total archived: ${totalArchived}`)
    return { success: true, totalArchived }
    
  } catch (error) {
    console.error('Archive process failed:', error)
    return { success: false, totalArchived: 0 }
  }
}

// Get archive statistics
export const getArchiveStats = async () => {
  try {
    const { data: mainCount, error: mainError } = await supabase
      .from('cv_history')
      .select('*', { count: 'exact', head: true })
    
    const { data: archiveCount, error: archiveError } = await supabase
      .from('cv_history_archive')
      .select('*', { count: 'exact', head: true })
    
    if (mainError || archiveError) {
      console.error('Error getting archive stats:', mainError || archiveError)
      return { mainCount: 0, archiveCount: 0 }
    }
    
    return {
      mainCount: mainCount || 0,
      archiveCount: archiveCount || 0
    }
    
  } catch (error) {
    console.error('Failed to get archive stats:', error)
    return { mainCount: 0, archiveCount: 0 }
  }
}

// Restore archived versions (admin only)
export const restoreArchivedVersions = async (cvId, versionNumbers) => {
  try {
    // Get archived versions
    const { data: archivedVersions, error: fetchError } = await supabase
      .from('cv_history_archive')
      .select('*')
      .eq('cv_id', cvId)
      .in('version_number', versionNumbers)
    
    if (fetchError) {
      console.error('Error fetching archived versions:', fetchError)
      return { success: false, restored: 0 }
    }
    
    if (!archivedVersions || archivedVersions.length === 0) {
      return { success: true, restored: 0 }
    }
    
    // Insert back into main history table
    const { error: restoreError } = await supabase
      .from('cv_history')
      .insert(archivedVersions)
    
    if (restoreError) {
      console.error('Error restoring versions:', restoreError)
      return { success: false, restored: 0 }
    }
    
    // Remove from archive table
    const versionIds = archivedVersions.map(v => v.id)
    const { error: deleteError } = await supabase
      .from('cv_history_archive')
      .delete()
      .in('id', versionIds)
    
    if (deleteError) {
      console.error('Error removing from archive:', deleteError)
      return { success: false, restored: 0 }
    }
    
    console.log(`Restored ${archivedVersions.length} versions for CV ${cvId}`)
    return { success: true, restored: archivedVersions.length }
    
  } catch (error) {
    console.error('Failed to restore archived versions:', error)
    return { success: false, restored: 0 }
  }
} 