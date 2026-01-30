import React, { useState, useEffect } from 'react';
import { Award, Settings, History, Plus, Minus, CheckCircle } from 'lucide-react';
import { addItemPoints, subtractItemPoints, getCVItemsWithPoints, getItemPointsHistory, getSectionDisplayName, getItemDisplayText, calculateCourseScore } from '../utils/itemPointsManager';

const ItemPointsManager = ({ cv, onPointsUpdate }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [itemsWithPoints, setItemsWithPoints] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('add');
  
  // Batch operation states
  const [pendingChanges, setPendingChanges] = useState([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [applyingChanges, setApplyingChanges] = useState(false);

  useEffect(() => {
    loadItemsWithPoints();
  }, [cv.id, cv.full_name, cv.updated_at, cv]);

  const loadItemsWithPoints = async () => {
    setLoadingItems(true);
    try {
      const items = await getCVItemsWithPoints(cv.id);
      setItemsWithPoints(items);
    } catch (error) {
      console.error('Error loading items with points:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  // Get all CV items from the CV data
  const getAllCVItems = () => {
    const items = [];
    
    // Helper function to check if an item has meaningful content
    const hasContent = (item) => {
      if (!item || typeof item !== 'object') return false;
      
      // Check if the item has any non-empty string properties
      return Object.values(item).some(value => 
        typeof value === 'string' && value.trim() !== ''
      );
    };
    
    // Add education items
    if (cv.education && Array.isArray(cv.education) && cv.education.length > 0) {
      cv.education.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'education',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add academic employment items
    if (cv.academic_employment && Array.isArray(cv.academic_employment) && cv.academic_employment.length > 0) {
      cv.academic_employment.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'academic_employment',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add teaching items
    if (cv.teaching && Array.isArray(cv.teaching) && cv.teaching.length > 0) {
      cv.teaching.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'teaching',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add courses items
    if (cv.courses && Array.isArray(cv.courses) && cv.courses.length > 0) {
      cv.courses.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'courses',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add publications research items
    if (cv.publications_research && Array.isArray(cv.publications_research) && cv.publications_research.length > 0) {
      cv.publications_research.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'publications_research',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add publications books items
    if (cv.publications_books && Array.isArray(cv.publications_books) && cv.publications_books.length > 0) {
      cv.publications_books.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'publications_books',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add conference presentations items
    if (cv.conference_presentations && Array.isArray(cv.conference_presentations) && cv.conference_presentations.length > 0) {
      cv.conference_presentations.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'conference_presentations',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add professional service items
    if (cv.professional_service && Array.isArray(cv.professional_service) && cv.professional_service.length > 0) {
      cv.professional_service.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'professional_service',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    // Add internal activities items
    if (cv.internal_activities && Array.isArray(cv.internal_activities) && cv.internal_activities.length > 0) {
      cv.internal_activities.forEach((item, index) => {
        if (hasContent(item)) {
          items.push({
            section_name: 'internal_activities',
            item_index: index,
            item_data: item,
            points: 0
          });
        }
      });
    }
    
    return items;
  };

  // Merge items with points data (prefer live CV item_data for display)
  const getMergedItems = () => {
    const allItems = getAllCVItems();
    const itemsWithPointsMap = new Map();
    
    // Create a map of items that have points
    itemsWithPoints.forEach(item => {
      const key = `${item.section_name}-${item.item_index}`;
      itemsWithPointsMap.set(key, item);
    });
    
    // Merge all items with their points data, but keep live item_data from CV
    return allItems.map(item => {
      const key = `${item.section_name}-${item.item_index}`;
      const itemWithPoints = itemsWithPointsMap.get(key);
      if (itemWithPoints) {
        return { ...itemWithPoints, item_data: item.item_data };
      }
      return item;
    });
  };

  // Add change to pending queue
  const addToPendingChanges = () => {
    if (!points || points <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    if (!selectedItem) {
      alert('Please select an item');
      return;
    }

    const change = {
      id: Date.now() + Math.random(), // Unique ID for the change
      userId: cv.user_id,
      cvId: cv.id,
      sectionName: selectedItem.section_name,
      itemIndex: selectedItem.item_index,
      points: parseInt(points),
      reason: reason || 'Admin adjustment',
      action: action,
      itemDisplay: getItemDisplayText(selectedItem.section_name, selectedItem.item_data)
    };

    setPendingChanges(prev => [...prev, change]);
    setPoints('');
    setReason('');
    setSelectedItem(null);
  };

  // Remove change from pending queue
  const removePendingChange = (changeId) => {
    setPendingChanges(prev => prev.filter(change => change.id !== changeId));
  };

  // Apply all pending changes
  const applyAllChanges = async () => {
    if (pendingChanges.length === 0) {
      alert('No changes to apply');
      return;
    }

    setApplyingChanges(true);
    try {
      for (const change of pendingChanges) {
        if (change.action === 'add') {
          await addItemPoints(change.userId, change.cvId, change.sectionName, change.itemIndex, change.points, change.reason);
        } else {
          await subtractItemPoints(change.userId, change.cvId, change.sectionName, change.itemIndex, change.points, change.reason);
        }
      }

      // Clear pending changes and refresh data
      setPendingChanges([]);
      setIsBatchMode(false);
      setShowModal(false);
      
      // Refresh the points display
      setTimeout(async () => {
        onPointsUpdate();
        await loadItemsWithPoints();
      }, 100);

      alert(`Successfully applied ${pendingChanges.length} changes!`);
    } catch (error) {
      console.error('Error applying changes:', error);
      alert(`Error applying changes: ${error.message}`);
    } finally {
      setApplyingChanges(false);
    }
  };

  // Cancel all pending changes
  const cancelAllChanges = () => {
    setPendingChanges([]);
    setIsBatchMode(false);
    setShowModal(false);
  };

  const handleShowHistory = async () => {
    setHistoryLoading(true);
    try {
      const historyData = await getItemPointsHistory(cv.id);
      setHistory(historyData);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Error fetching points history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalPoints = () => {
    // Sum points from item_points table (excluding courses - they're handled separately)
    const itemPointsTotal = getMergedItems()
      .filter(item => item.section_name !== 'courses')
      .reduce((sum, item) => sum + (item.points || 0), 0);
    
    // Add course credit hours (from courses array)
    const courseCreditHours = calculateCourseScore(cv);
    
    // Add course bonus points from item_points table
    const courseBonusPoints = getMergedItems()
      .filter(item => item.section_name === 'courses')
      .reduce((sum, item) => sum + (item.points || 0), 0);
    
    return itemPointsTotal + courseCreditHours + courseBonusPoints;
  };

  return (
    <>
      {/* Compact Points Display with Dropdown Toggle */}
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-yellow-500" />
        <span className="font-semibold text-gray-700">
          {getTotalPoints()} pts
        </span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
          title="Manage Item Points"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={handleShowHistory}
          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
          title="View History"
        >
          <History className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown Item Points */}
      {showDropdown && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700">Item Points Management</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={`px-3 py-1 text-xs rounded ${
                  isBatchMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isBatchMode ? 'Batch Mode ON' : 'Batch Mode'}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Manage Points
              </button>
            </div>
          </div>
          
          {loadingItems ? (
            <div className="text-center py-4">Loading items...</div>
          ) : getMergedItems().length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No CV items found. Add some content to the CV first.
            </div>
          ) : (
            <div className="space-y-2">
              {getMergedItems().map((item, index) => (
                <div key={`${item.section_name}-${item.item_index}`} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-600">
                        {getSectionDisplayName(item.section_name)}
                      </div>
                      <div className="text-sm text-gray-800">
                        {getItemDisplayText(item.section_name, item.item_data)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Current Points: {item.points || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Points Management Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isBatchMode ? 'Batch Points Management' : 'Points Management'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {isBatchMode && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Batch Mode Active</span>
                </div>
                <p className="text-sm text-blue-700">
                  Changes will be queued and applied all at once. Click "Apply All Changes" when ready.
                </p>
              </div>
            )}

            {/* Pending Changes Display */}
            {isBatchMode && pendingChanges.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Pending Changes ({pendingChanges.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pendingChanges.map((change) => (
                    <div key={change.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {change.action === 'add' ? '+' : '-'}{change.points} pts
                        </div>
                        <div className="text-xs text-gray-600">{change.itemDisplay}</div>
                      </div>
                      <button
                        onClick={() => removePendingChange(change.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Points Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Item
                </label>
                <select
                  value={selectedItem ? `${selectedItem.section_name}-${selectedItem.item_index}` : ''}
                  onChange={(e) => {
                    const [sectionName, itemIndex] = e.target.value.split('-');
                    const item = getMergedItems().find(item => 
                      item.section_name === sectionName && item.item_index === parseInt(itemIndex)
                    );
                    setSelectedItem(item);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an item...</option>
                  {getMergedItems().map((item) => (
                    <option key={`${item.section_name}-${item.item_index}`} value={`${item.section_name}-${item.item_index}`}>
                      {getSectionDisplayName(item.section_name)}: {getItemDisplayText(item.section_name, item.item_data)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Enter points"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for points adjustment"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAction('add')}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    action === 'add' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Points
                </button>
                <button
                  onClick={() => setAction('subtract')}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    action === 'subtract' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Subtract Points
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {isBatchMode ? (
                  <>
                    <button
                      onClick={addToPendingChanges}
                      disabled={!selectedItem || !points || points <= 0}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add to Queue
                    </button>
                    <button
                      onClick={applyAllChanges}
                      disabled={pendingChanges.length === 0 || applyingChanges}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyingChanges ? 'Applying...' : `Apply All Changes (${pendingChanges.length})`}
                    </button>
                    <button
                      onClick={cancelAllChanges}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={async () => {
                      if (!points || points <= 0) {
                        alert('Please enter a valid number of points');
                        return;
                      }

                      if (!selectedItem) {
                        alert('Please select an item');
                        return;
                      }

                      setLoading(true);
                      try {
                        if (action === 'add') {
                          await addItemPoints(cv.user_id, cv.id, selectedItem.section_name, selectedItem.item_index, parseInt(points), reason || 'Admin adjustment');
                        } else {
                          await subtractItemPoints(cv.user_id, cv.id, selectedItem.section_name, selectedItem.item_index, parseInt(points), reason || 'Admin adjustment');
                        }
                        
                        setPoints('');
                        setReason('');
                        setSelectedItem(null);
                        
                        setTimeout(async () => {
                          onPointsUpdate();
                          await loadItemsWithPoints();
                        }, 100);
                      } catch (error) {
                        console.error('Error updating item points:', error);
                        if (error.message.includes('not set up')) {
                          alert('Item points system not set up. Please run the SQL setup in Supabase first.');
                        } else {
                          alert(`Error updating points: ${error.message}`);
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={!selectedItem || !points || points <= 0 || loading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : `${action === 'add' ? 'Add' : 'Subtract'} Points`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Points History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No points history found.</div>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.points_change > 0 ? '+' : ''}{entry.points_change} points
                        </div>
                        <div className="text-sm text-gray-600">
                          {getSectionDisplayName(entry.section_name)} - Item {entry.item_index + 1}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.reason} • {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ItemPointsManager; 