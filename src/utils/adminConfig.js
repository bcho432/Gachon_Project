// Admin Configuration
// Add or remove admin user IDs here
export const ADMIN_USER_IDS = [
  'f9f4b401-748d-4a7e-9ba6-127277616ee9', // chobryan04@gmail.com
  // 'another-user-uuid-here', // Add more admins here
  // 'dad-user-uuid-here',     // Your dad's ID when ready
]

// Helper function to check if user is admin
export const checkIsAdmin = (userId) => {
  return ADMIN_USER_IDS.includes(userId)
}

// Function to add new admin
export const addAdmin = (userId) => {
  if (!ADMIN_USER_IDS.includes(userId)) {
    ADMIN_USER_IDS.push(userId)
  }
}

// Function to remove admin
export const removeAdmin = (userId) => {
  const index = ADMIN_USER_IDS.indexOf(userId)
  if (index > -1) {
    ADMIN_USER_IDS.splice(index, 1)
  }
} 