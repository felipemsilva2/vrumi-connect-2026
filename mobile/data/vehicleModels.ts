// Vehicle models data for Brazilian driving schools
// Images can be added via Supabase Storage upload

export interface VehicleModel {
    id: string;
    brand: string;
    model: string;
    displayName: string;
    imageUrl: string | null;
}

// Popular cars used in Brazilian driving schools
// Images are set to null - will fallback to car icon
// In the future, photos can be uploaded by instructors
export const VEHICLE_MODELS: VehicleModel[] = [
    // Chevrolet
    { id: 'chevrolet-onix', brand: 'Chevrolet', model: 'Onix', displayName: 'Chevrolet Onix', imageUrl: null },
    { id: 'chevrolet-prisma', brand: 'Chevrolet', model: 'Prisma', displayName: 'Chevrolet Prisma', imageUrl: null },
    { id: 'chevrolet-joy', brand: 'Chevrolet', model: 'Joy', displayName: 'Chevrolet Joy', imageUrl: null },

    // Volkswagen
    { id: 'volkswagen-gol', brand: 'Volkswagen', model: 'Gol', displayName: 'Volkswagen Gol', imageUrl: null },
    { id: 'volkswagen-voyage', brand: 'Volkswagen', model: 'Voyage', displayName: 'Volkswagen Voyage', imageUrl: null },
    { id: 'volkswagen-polo', brand: 'Volkswagen', model: 'Polo', displayName: 'Volkswagen Polo', imageUrl: null },

    // Fiat
    { id: 'fiat-mobi', brand: 'Fiat', model: 'Mobi', displayName: 'Fiat Mobi', imageUrl: null },
    { id: 'fiat-argo', brand: 'Fiat', model: 'Argo', displayName: 'Fiat Argo', imageUrl: null },
    { id: 'fiat-cronos', brand: 'Fiat', model: 'Cronos', displayName: 'Fiat Cronos', imageUrl: null },
    { id: 'fiat-uno', brand: 'Fiat', model: 'Uno', displayName: 'Fiat Uno', imageUrl: null },

    // Hyundai
    { id: 'hyundai-hb20', brand: 'Hyundai', model: 'HB20', displayName: 'Hyundai HB20', imageUrl: null },
    { id: 'hyundai-hb20s', brand: 'Hyundai', model: 'HB20S', displayName: 'Hyundai HB20S', imageUrl: null },

    // Renault
    { id: 'renault-kwid', brand: 'Renault', model: 'Kwid', displayName: 'Renault Kwid', imageUrl: null },
    { id: 'renault-sandero', brand: 'Renault', model: 'Sandero', displayName: 'Renault Sandero', imageUrl: null },
    { id: 'renault-logan', brand: 'Renault', model: 'Logan', displayName: 'Renault Logan', imageUrl: null },

    // Toyota
    { id: 'toyota-etios', brand: 'Toyota', model: 'Etios', displayName: 'Toyota Etios', imageUrl: null },
    { id: 'toyota-yaris', brand: 'Toyota', model: 'Yaris', displayName: 'Toyota Yaris', imageUrl: null },

    // Ford
    { id: 'ford-ka', brand: 'Ford', model: 'Ka', displayName: 'Ford Ka', imageUrl: null },

    // Nissan
    { id: 'nissan-march', brand: 'Nissan', model: 'March', displayName: 'Nissan March', imageUrl: null },
    { id: 'nissan-versa', brand: 'Nissan', model: 'Versa', displayName: 'Nissan Versa', imageUrl: null },

    // Honda
    { id: 'honda-city', brand: 'Honda', model: 'City', displayName: 'Honda City', imageUrl: null },
    { id: 'honda-fit', brand: 'Honda', model: 'Fit', displayName: 'Honda Fit', imageUrl: null },

    // Peugeot
    { id: 'peugeot-208', brand: 'Peugeot', model: '208', displayName: 'Peugeot 208', imageUrl: null },

    // Citroën
    { id: 'citroen-c3', brand: 'Citroën', model: 'C3', displayName: 'Citroën C3', imageUrl: null },

    // Other - generic car icon
    { id: 'outro', brand: 'Outro', model: 'Outro', displayName: 'Outro modelo', imageUrl: null },
];

// Get model by ID
export const getVehicleModel = (id: string): VehicleModel | undefined => {
    return VEHICLE_MODELS.find(v => v.id === id);
};

// Get model by name (for backwards compatibility with existing data)
export const getVehicleModelByName = (modelName: string): VehicleModel | undefined => {
    if (!modelName) return undefined;
    const lowerName = modelName.toLowerCase();
    return VEHICLE_MODELS.find(v =>
        lowerName.includes(v.brand.toLowerCase()) ||
        lowerName.includes(v.model.toLowerCase())
    );
};

// Group models by brand for picker display
export const getVehicleModelsByBrand = (): Record<string, VehicleModel[]> => {
    return VEHICLE_MODELS.reduce((acc, model) => {
        if (!acc[model.brand]) {
            acc[model.brand] = [];
        }
        acc[model.brand].push(model);
        return acc;
    }, {} as Record<string, VehicleModel[]>);
};
