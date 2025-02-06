import Papa from 'papaparse';
import type { Report, ImageRating } from '../types';
import { validateImagePath } from './image';

export async function parseReportsCSV(file: File): Promise<Report[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const reports: Report[] = results.data
            .filter((row: any) => row.idx && row.image_path)
            .map((row: any) => {
              // Validate image path
              if (!validateImagePath(row.image_path)) {
                throw new Error(`Invalid image path: ${row.image_path}`);
              }

              return {
                idx: parseInt(row.idx),
                image_path: row.image_path,
                model_responses: [
                  row.model1_response,
                  row.model2_response,
                  row.model3_response,
                  row.model4_response,
                  row.model5_response,
                ].filter(Boolean),
              };
            });

          if (reports.length === 0) {
            throw new Error('No valid reports found in CSV');
          }

          resolve(reports);
        } catch (error) {
          reject(error);
        }
      },
      header: true,
      error: (error) => reject(error),
    });
  });
}

export function exportRatingsCSV(ratings: ImageRating[]): void {
  const rows = ratings.map((rating) => {
    const baseRow = {
      idx: rating.idx,
      image_path: rating.image_path,
    };

    const modelRatings = rating.modelRatings.reduce((acc, mr) => ({
      ...acc,
      [`model${mr.modelIndex + 1}_ratings`]: JSON.stringify(mr.scores),
    }), {});

    return { ...baseRow, ...modelRatings };
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'radiologist_ratings.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}