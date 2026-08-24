export interface CompanyPhotoGalleryItem {
  id: string;
  key: string;
  url: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  caption?: string;
  order?: number;
  createdDate?: string;
  createdBy?: string;
}

export interface CompanyPhotoGalleryResponse {
  canEdit?: boolean;
  items: CompanyPhotoGalleryItem[];
}

export interface CompanyPhotoGalleryCanEditResponse {
  canEdit: boolean;
}
