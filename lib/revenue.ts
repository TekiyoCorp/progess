import { Folder, Task } from '@/types';

/**
 * Calcule le CA réel basé sur les dossiers et leur pourcentage de complétion
 * Prend en compte les acomptes et paiements partiels
 * Compte TOUS les dossiers avec un prix, même s'ils n'ont pas de tâches
 */
export function calculateRevenueFromFolders(folders: Folder[], tasks: Task[]): number {
  if (!folders || folders.length === 0) return 0;

  let totalRevenue = 0;

  folders.forEach(folder => {
    const folderPrice = folder.price || 0;
    if (folderPrice === 0) return;

    // Trouver toutes les tâches de ce dossier
    const folderTasks = tasks.filter(t => t.folder_id === folder.id);
    
    // Si le dossier n'a pas de tâches, on compte quand même le prix complet
    // (projet démarré mais pas encore décomposé en tâches)
    if (folderTasks.length === 0) {
      totalRevenue += folderPrice;
      return;
    }

    // Calculer le pourcentage de complétion
    const completedTasks = folderTasks.filter(t => t.completed).length;
    const completionPercentage = folderTasks.length > 0
      ? (completedTasks / folderTasks.length) * 100
      : 0;

    // CA = prix du dossier * pourcentage de complétion
    // Exemple: dossier 10k€ à 50% = 5k€ de CA
    // Si le dossier est à 100%, on compte le prix complet
    const folderRevenue = completionPercentage >= 100
      ? folderPrice
      : (folderPrice * completionPercentage) / 100;
    
    totalRevenue += folderRevenue;
  });

  return Math.round(totalRevenue);
}

/**
 * Calcule le CA potentiel (somme de tous les prix des dossiers)
 */
export function calculatePotentialRevenue(folders: Folder[]): number {
  if (!folders || folders.length === 0) return 0;
  
  return folders.reduce((sum, folder) => {
    return sum + (folder.price || 0);
  }, 0);
}

