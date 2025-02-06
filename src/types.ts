export interface Report {
  idx: number;
  image_path: string;
  model_responses: string[];
}

export interface Scores {
  accuracy: number;
  comprehensiveness: number;
  clarity: number;
  interpretation: number;
  terminology: number;
}

export interface ModelRating {
  modelIndex: number;
  scores: Scores;
}

export interface ImageRating {
  idx: number;
  image_path: string;
  modelRatings: ModelRating[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}