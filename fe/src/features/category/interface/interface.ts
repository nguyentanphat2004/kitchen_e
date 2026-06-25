export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  image?: string;
  imagePath?: string;
  icon?: string;
  displayOrder: number;
  featured: boolean;
  showInMenu: boolean;
  showInHome: boolean;
  isActive: boolean;
  isDeleted: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
  productsCount?: number;
  subcategories?: Category[];
  level?: number;
}
export interface CategoryFormData {
  name: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
  featured?: boolean;
  showInMenu?: boolean;
  showInHome?: boolean;
  isActive?: boolean;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  removeImage?: boolean;
}