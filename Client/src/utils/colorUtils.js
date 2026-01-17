// Generate a consistent color for a user based on their name
export const getUserColor = (userName) => {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEAA7", // Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Light Yellow
    "#BB8FCE", // Light Purple
    "#85C1E9", // Light Blue
    "#F8C471", // Light Orange
    "#82E0AA", // Light Green
  ];

  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    const char = userName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return colors[Math.abs(hash) % colors.length];
};

// Generate a lighter version of the color for the cursor
export const getCursorOrLabelColor = (userName) => {
  const baseColor = getUserColor(userName);
  return baseColor;
};
