export interface CustomizationOption {
  name: string;
  value: string;
  priceAdjustment: number;
  image?: string | File; // Allow File type for new uploads
  isDefault: boolean;
}

export interface Customization {
  _id: string;
  name: string;
  customizationType: string;
  description: string;
  options: CustomizationOption[];
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
}