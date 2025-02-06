import type { ImageRating, User } from '../types';

const USERS_KEY = 'radiologist-users';
const RATINGS_PREFIX = 'radiologist-ratings-';

export function saveUser(user: User): void {
  const users = getUsers();
  const existingUserIndex = users.findIndex(u => u.id === user.id);
  
  if (existingUserIndex >= 0) {
    users[existingUserIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUsers(): User[] {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

export function getCurrentUser(): User | null {
  const currentUserJson = localStorage.getItem('current-user');
  return currentUserJson ? JSON.parse(currentUserJson) : null;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem('current-user', JSON.stringify(user));
}

export function saveRatings(userId: string, ratings: ImageRating[]): void {
  localStorage.setItem(`${RATINGS_PREFIX}${userId}`, JSON.stringify(ratings));
}

export function getRatings(userId: string): ImageRating[] {
  const ratingsJson = localStorage.getItem(`${RATINGS_PREFIX}${userId}`);
  return ratingsJson ? JSON.parse(ratingsJson) : [];
}

export function getAllUserRatings(): { userId: string; ratings: ImageRating[] }[] {
  const users = getUsers();
  return users.map(user => ({
    userId: user.id,
    ratings: getRatings(user.id)
  }));
}

export function getCompletionStats(totalReports: number): {
  totalRadiologists: number;
  activeRadiologists: number;
  completionRates: { userId: string; name: string; completed: number; total: number }[];
} {
  const users = getUsers();
  const userRatings = getAllUserRatings();
  const activeUsers = userRatings.filter(ur => ur.ratings.length > 0);

  const completionRates = activeUsers.map(ur => {
    const user = users.find(u => u.id === ur.userId);
    const completedReports = ur.ratings.filter(r => r.modelRatings.length === 5).length;
    return {
      userId: ur.userId,
      name: user?.name || 'Unknown',
      completed: completedReports,
      total: totalReports
    };
  });

  return {
    totalRadiologists: users.length,
    activeRadiologists: activeUsers.length,
    completionRates
  };
}

export function exportUserRatings(userId: string): void {
  const ratings = getRatings(userId);
  const user = getUsers().find(u => u.id === userId);
  
  if (!ratings.length) {
    alert('No ratings to export.');
    return;
  }

  const rows = ratings.map((rating) => {
    const baseRow = {
      idx: rating.idx,
      image_path: rating.image_path,
      rater_id: userId,
      rater_name: user?.name || '',
      rater_email: user?.email || '',
    };

    const modelRatings = rating.modelRatings.reduce((acc, mr) => ({
      ...acc,
      [`model${mr.modelIndex + 1}_ratings`]: JSON.stringify(mr.scores),
    }), {});

    return { ...baseRow, ...modelRatings };
  });

  const csv = rows.map(row => {
    return Object.values(row).map(value => 
      typeof value === 'string' ? `"${value}"` : value
    ).join(',');
  }).join('\n');

  const headers = Object.keys(rows[0]).join(',');
  const csvContent = `${headers}\n${csv}`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `radiologist_ratings_${userId}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}