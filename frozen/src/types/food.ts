export type CookingMethod = {
    temperature: number;
    timeMin: number;
    timeMax?: number;
};

export type FoodItem = {
    id: string;

    name: string;
    brand?: string;

    oven?: {
        topBottomHeat?: CookingMethod;
        fan?: CookingMethod;
    };

    airFryer?: CookingMethod;

    notes?: string;

    createdAt: string;
    updatedAt: string;
};