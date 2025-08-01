import React, { useState } from 'react';
import { Plus, Minus, Award, History } from 'lucide-react';
import { addPoints, subtractPoints, getPointsHistory } from '../utils/pointsManager';

const PointsManager = ({ user, onPointsUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('add'); // 'add' or 'subtract'
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleAction = async () => {
    if (!points || points <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    setLoading(true);
    try {
      if (action === 'add') {
        await addPoints(user.user_id, parseInt(points), reason || 'Admin adjustment');
      } else {
        await subtractPoints(user.user_id, parseInt(points), reason || 'Admin adjustment');
      }
      
      setShowModal(false);
      setPoints('');
      setReason('');
      onPointsUpdate(); // Refresh the points display
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Error updating points. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowHistory = async () => {
    setHistoryLoading(true);
    try {
      const historyData = await getPointsHistory(user.user_id);
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

  return (
    <>
      {/* Points Display and Action Buttons */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-gray-700 text-sm">
            {user.points || 0} pts
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setAction('add');
              setShowModal(true);
            }}
            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
            title="Add Points"
          >
            <Plus className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => {
              setAction('subtract');
              setShowModal(true);
            }}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            title="Subtract Points"
          >
            <Minus className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleShowHistory}
            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
            title="View History"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Points Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {action === 'add' ? 'Add Points' : 'Subtract Points'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User: {user.full_name}
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Points: {user.points || 0}
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points to {action === 'add' ? 'Add' : 'Subtract'}
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter points"
                  min="1"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for adjustment"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 px-4 py-2 text-white rounded-md ${
                  action === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={loading}
              >
                {loading ? 'Processing...' : (action === 'add' ? 'Add Points' : 'Subtract Points')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Points History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Points History - {user.full_name}
            </h3>
            
            {historyLoading ? (
              <div className="text-center py-4">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No points history found
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`font-semibold ${
                          entry.points_change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.points_change > 0 ? '+' : ''}{entry.points_change} pts
                        </span>
                        {entry.reason && (
                          <p className="text-sm text-gray-600 mt-1">{entry.reason}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setShowHistory(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PointsManager; 