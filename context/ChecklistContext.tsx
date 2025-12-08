import React, { createContext, useContext, useState, ReactNode } from 'react';

type ChecklistItem = {
    id: string;
    text: string;
    weight: number;
    checked: boolean;
};

type DefaultChecklist = {
    weekly: ChecklistItem[];
    daily: ChecklistItem[];
    fourHour: ChecklistItem[];
    lowerTimeframes: ChecklistItem[];
    entry: ChecklistItem[];
};

type ChecklistContextType = {
    defaultChecklist: DefaultChecklist;
    customChecklist: ChecklistItem[];
    toggleDefaultItem: (timeframe: keyof DefaultChecklist, itemId: string) => void;
    toggleCustomItem: (itemId: string) => void;
    addCustomItem: (text: string) => void;
    deleteCustomItem: (itemId: string) => void;
    calculateScore: () => number;
    getConfluenceData: () => any[];
    resetChecklist: () => void;
};

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

const initialDefaultChecklist: DefaultChecklist = {
    weekly: [
        { id: 'w1', text: 'Trend confirmed', weight: 20, checked: false },
        { id: 'w2', text: 'Key level identified', weight: 15, checked: false },
        { id: 'w3', text: 'Structure intact', weight: 15, checked: false },
    ],
    daily: [
        { id: 'd1', text: 'Trend aligned with weekly', weight: 20, checked: false },
        { id: 'd2', text: 'Key level respected', weight: 15, checked: false },
        { id: 'd3', text: 'Price action clear', weight: 10, checked: false },
    ],
    fourHour: [
        { id: '4h1', text: 'Trend continuation', weight: 15, checked: false },
        { id: '4h2', text: 'Break and retest', weight: 10, checked: false },
    ],
    lowerTimeframes: [
        { id: 'lt1', text: 'Entry pattern formed', weight: 10, checked: false },
        { id: 'lt2', text: 'Stop loss clear', weight: 10, checked: false },
    ],
    entry: [
        { id: 'e1', text: 'Risk/Reward favorable', weight: 10, checked: false },
        { id: 'e2', text: 'No major news', weight: 10, checked: false },
    ],
};

export function ChecklistProvider({ children }: { children: ReactNode }) {
    const [defaultChecklist, setDefaultChecklist] = useState<DefaultChecklist>(initialDefaultChecklist);
    const [customChecklist, setCustomChecklist] = useState<ChecklistItem[]>([]);

    const toggleDefaultItem = (timeframe: keyof DefaultChecklist, itemId: string) => {
        setDefaultChecklist((prev) => ({
            ...prev,
            [timeframe]: prev[timeframe].map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
        }));
    };

    const toggleCustomItem = (itemId: string) => {
        setCustomChecklist((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item))
        );
    };

    const addCustomItem = (text: string) => {
        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text,
            weight: 5,
            checked: false,
        };
        setCustomChecklist((prev) => [...prev, newItem]);
    };

    const deleteCustomItem = (itemId: string) => {
        setCustomChecklist((prev) => prev.filter((item) => item.id !== itemId));
    };

    const calculateScore = () => {
        let total = 0;

        Object.values(defaultChecklist).forEach((items) => {
            items.forEach((item) => {
                if (item.checked) total += item.weight;
            });
        });

        customChecklist.forEach((item) => {
            if (item.checked) total += item.weight;
        });

        return total;
    };

    const getConfluenceData = () => {
        const allItems: any[] = [];

        // Weekly
        defaultChecklist.weekly.forEach((item) => {
            if (item.checked) {
                allItems.push({
                    timeframe: 'Weekly',
                    label: item.text,
                    weight: item.weight,
                    checked: true,
                });
            }
        });

        // Daily
        defaultChecklist.daily.forEach((item) => {
            if (item.checked) {
                allItems.push({
                    timeframe: 'Daily',
                    label: item.text,
                    weight: item.weight,
                    checked: true,
                });
            }
        });

        // 4H
        defaultChecklist.fourHour.forEach((item) => {
            if (item.checked) {
                allItems.push({
                    timeframe: '4H',
                    label: item.text,
                    weight: item.weight,
                    checked: true,
                });
            }
        });

        // Lower timeframes
        defaultChecklist.lowerTimeframes.forEach((item) => {
            if (item.checked) {
                allItems.push({
                    timeframe: '2H/1H/30m',
                    label: item.text,
                    weight: item.weight,
                    checked: true,
                });
            }
        });

        // Entry
        defaultChecklist.entry.forEach((item) => {
            if (item.checked) {
                allItems.push({
                    timeframe: 'Entry',
                    label: item.text,
                    weight: item.weight,
                    checked: true,
                });
            }
        });

        // Custom
        customChecklist.forEach((item) => {
            if (item.checked) {
                allItems.push({
                    timeframe: 'Custom',
                    label: item.text,
                    weight: item.weight,
                    checked: true,
                });
            }
        });

        return allItems;
    };

    const resetChecklist = () => {
        setDefaultChecklist(initialDefaultChecklist);
    };

    return (
        <ChecklistContext.Provider
            value={{
                defaultChecklist,
                customChecklist,
                toggleDefaultItem,
                toggleCustomItem,
                addCustomItem,
                deleteCustomItem,
                calculateScore,
                getConfluenceData,
                resetChecklist,
            }}
        >
            {children}
        </ChecklistContext.Provider>
    );
}

export function useChecklist() {
    const context = useContext(ChecklistContext);
    if (!context) {
        throw new Error('useChecklist must be used within ChecklistProvider');
    }
    return context;
}
