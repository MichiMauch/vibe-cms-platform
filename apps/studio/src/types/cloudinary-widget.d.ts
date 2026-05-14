type CloudinaryAsset = {
  secure_url: string;
  public_id: string;
  resource_type?: string;
  format?: string;
  width?: number;
  height?: number;
};

type MediaLibraryInstance = {
  show: (options?: Record<string, unknown>) => void;
  hide?: () => void;
};

type MediaLibraryOptions = {
  cloud_name: string;
  api_key: string;
  username?: string;
  timestamp?: string;
  signature?: string;
  multiple?: boolean;
  max_files?: number;
  insert_caption?: string;
  remove_header?: boolean;
  default_transformations?: unknown[];
};

type MediaLibraryCallbacks = {
  insertHandler?: (data: { assets: CloudinaryAsset[] }) => void;
  showHandler?: () => void;
  hideHandler?: () => void;
};

declare global {
  interface Window {
    cloudinary?: {
      createMediaLibrary: (
        options: MediaLibraryOptions,
        callbacks: MediaLibraryCallbacks,
      ) => MediaLibraryInstance;
    };
  }
}

export {};
