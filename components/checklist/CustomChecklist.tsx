import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Animated, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type ChecklistItem = {
    id: string;
    label: string;
    description: string;
    percentage: number;
    user_id?: string;
};

// Funkcija za određivanje kategorije setup-a
const getSetupCategory = (percentage: number): { label: string; color: string } => {
    if (percentage <= 30) return { label: 'Weak Setup', color: '#EF4444' };
    if (percentage <= 55) return { label: 'Below Standard', color: '#F59E0B' };
    if (percentage <= 65) return { label: 'Moderate', color: '#F59E0B' };
    if (percentage <= 75) return { label: 'Acceptable', color: '#FCD34D' };
    if (percentage <= 85) return { label: 'Good', color: '#10B981' };
    if (percentage <= 95) return { label: 'Strong', color: '#10B981' };
    if (percentage <= 115) return { label: 'Very Strong', color: '#00F5D4' };
    if (percentage <= 135) return { label: 'Outstanding', color: '#00F5D4' };
    if (percentage <= 155) return { label: 'Excellent', color: '#00F5D4' };
    return { label: 'Perfect Trade', color: '#00F5D4' };
};

export default function CustomChecklist() {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemPercentage, setNewItemPercentage] = useState('');
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Scroll indicators
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const handleScroll = (event: any) => {
        const scrollX = event.nativeEvent.contentOffset.x;
        const contentWidth = event.nativeEvent.contentSize.width;
        const layoutWidth = event.nativeEvent.layoutMeasurement.width;

        setShowLeftArrow(scrollX > 10);
        setShowRightArrow(scrollX < contentWidth - layoutWidth - 10);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('custom_checklist_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
            Alert.alert('Error', 'Failed to load checklist items');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItemLabel.trim()) {
            Alert.alert('Error', 'Please enter a label');
            return;
        }

        const percentage = parseInt(newItemPercentage);
        if (isNaN(percentage) || percentage <= 0) {
            Alert.alert('Error', 'Please enter a valid percentage');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('custom_checklist_items')
                .insert([
                    {
                        user_id: user.id,
                        label: newItemLabel.trim(),
                        // Uklonjen description
                        percentage: percentage,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            setItems([...items, data]);
            setNewItemLabel('');
            setNewItemDescription('');
            setNewItemPercentage('');
            setAddModalVisible(false);
            Alert.alert('Success', 'Item added successfully');
        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Error', 'Failed to add item');
        }
    };


    const handleDeleteItem = async (itemId: string) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('custom_checklist_items')
                                .delete()
                                .eq('id', itemId);

                            if (error) throw error;

                            setItems(items.filter((item) => item.id !== itemId));
                            const newChecked = new Set(checkedItems);
                            newChecked.delete(itemId);
                            setCheckedItems(newChecked);
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            Alert.alert('Error', 'Failed to delete item');
                        }
                    },
                },
            ]
        );
    };

    const handleToggle = (item: ChecklistItem) => {
        if (checkedItems.has(item.id)) {
            const newChecked = new Set(checkedItems);
            newChecked.delete(item.id);
            setCheckedItems(newChecked);
        } else {
            Alert.alert(
                item.label,
                item.description + '\n\nHave you completed this step?',
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes',
                        onPress: () => setCheckedItems(new Set(checkedItems).add(item.id)),
                    },
                ]
            );
        }
    };

    // Calculate overall percentage
    const overallPercentage = items.reduce((sum, item) => {
        return checkedItems.has(item.id) ? sum + item.percentage : sum;
    }, 0);

    const setupCategory = getSetupCategory(overallPercentage);
    const totalChecked = items.filter(item => checkedItems.has(item.id)).length;

    if (loading) {
        return (
            <View className="flex-1 bg-bg-primary items-center justify-center">
                <Text className="text-txt-secondary">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-bg-primary">
            {/* Add Button - Top Right */}
            <View className="px-3 pt-2 pb-1 flex-row justify-end">
                <TouchableOpacity
                    onPress={() => setAddModalVisible(true)}
                    className="bg-accent-cyan rounded-lg px-4 py-2 flex-row items-center"
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={20} color="#1B2838" />
                    <Text className="text-bg-primary font-bold text-sm ml-1">
                        Add Item
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 110 }}
            >
                {/* Items */}
                <View className="px-3 pb-3">
                    {items.length === 0 ? (
                        <View className="bg-bg-secondary rounded-xl p-6 items-center justify-center border border-border">
                            <Ionicons name="list-outline" size={48} color="#8B95A5" />
                            <Text className="text-txt-secondary text-center mt-4 mb-2">
                                No custom items yet
                            </Text>
                            <Text className="text-txt-tertiary text-center text-sm">
                                Tap "Add Item" to create your own checklist
                            </Text>
                        </View>
                    ) : (
                        items.map((item) => {
                            const isChecked = checkedItems.has(item.id);
                            return (
                                <View
                                    key={item.id}
                                    className="flex-row items-center justify-between bg-bg-secondary rounded-lg p-3 mb-2 border border-border"
                                >
                                    <View className="flex-1 mr-3">
                                        <Text className="text-txt-primary font-semibold text-base mb-1">
                                            {item.label}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center">
                                        <Text className="text-accent-cyan font-bold text-sm mr-3">
                                            {item.percentage}%
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => handleToggle(item)}
                                            className={`w-12 h-7 rounded-full p-0.5 ${
                                                isChecked ? 'bg-accent-cyan' : 'bg-bg-tertiary'
                                            }`}
                                            activeOpacity={0.8}
                                        >
                                            <View
                                                className={`w-6 h-6 rounded-full bg-white shadow-lg ${
                                                    isChecked ? 'self-end' : 'self-start'
                                                }`}
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleDeleteItem(item.id)}
                                            className="ml-3 bg-red-500/20 rounded-lg p-2"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Confluence Summary Box */}
                {items.length > 0 && (
                    <View className="mx-3 mt-2 mb-2 bg-bg-secondary rounded-xl p-4 border border-border">
                        <Text className="text-txt-secondary text-center text-xs font-semibold mb-3 tracking-wider">
                            MY CHECKLIST SUMMARY
                        </Text>

                        {/* Overall Score - Samo procenat */}
                        <View
                            className="rounded-xl p-4 border"
                            style={{
                                backgroundColor: 'rgba(30, 42, 56, 0.8)',
                                borderColor: 'rgba(0, 245, 212, 0.3)',
                            }}
                        >
                            <Text className="text-txt-secondary text-xs font-semibold mb-2 text-center">
                                TOTAL SCORE
                            </Text>
                            <Text
                                className="text-6xl font-bold text-center"
                                style={{ color: setupCategory.color }}
                            >
                                {overallPercentage}%
                            </Text>
                        </View>
                    </View>
                )}


                {/* Save Button */}
                {items.length > 0 && (
                    <View className="px-3 pb-4">
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            className="bg-accent-cyan rounded-xl p-3.5"
                            activeOpacity={0.8}
                        >
                            <Text className="text-bg-primary text-center text-base font-bold">
                                Save Trade
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Add Item Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addModalVisible}
                onRequestClose={() => setAddModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1 bg-black/70 justify-end">
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ maxHeight: '80%' }}
                        >
                            <View className="bg-bg-secondary rounded-t-3xl p-6 border-t border-border">
                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-txt-primary text-2xl font-bold">
                                        Add New Item
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setAddModalVisible(false);
                                        }}
                                        className="w-10 h-10 bg-bg-tertiary rounded-full items-center justify-center"
                                    >
                                        <Text className="text-txt-primary text-xl font-bold">×</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    <View className="mb-4">
                                        <Text className="text-txt-secondary text-sm mb-2 font-semibold">
                                            Label *
                                        </Text>
                                        <TextInput
                                            className="bg-bg-tertiary text-txt-primary rounded-lg p-3 border border-border"
                                            placeholder="e.g., Check RSI"
                                            placeholderTextColor="#8B95A5"
                                            value={newItemLabel}
                                            onChangeText={setNewItemLabel}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            onSubmitEditing={() => Keyboard.dismiss()}
                                        />
                                    </View>

                                    <View className="mb-4">
                                        <Text className="text-txt-secondary text-sm mb-2 font-semibold">
                                            Description
                                        </Text>
                                        <TextInput
                                            className="bg-bg-tertiary text-txt-primary rounded-lg p-3 border border-border"
                                            placeholder="Optional description"
                                            placeholderTextColor="#8B95A5"
                                            value={newItemDescription}
                                            onChangeText={setNewItemDescription}
                                            multiline
                                            numberOfLines={3}
                                            returnKeyType="done"
                                            blurOnSubmit={true}
                                        />
                                    </View>

                                    <View className="mb-6">
                                        <Text className="text-txt-secondary text-sm mb-2 font-semibold">
                                            Percentage *
                                        </Text>
                                        <TextInput
                                            className="bg-bg-tertiary text-txt-primary rounded-lg p-3 border border-border"
                                            placeholder="e.g., 10"
                                            placeholderTextColor="#8B95A5"
                                            value={newItemPercentage}
                                            onChangeText={setNewItemPercentage}
                                            keyboardType="numeric"
                                            returnKeyType="done"
                                            onSubmitEditing={Keyboard.dismiss}
                                        />
                                    </View>

                                    <View className="flex-row space-x-3 mb-4">
                                        <TouchableOpacity
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setAddModalVisible(false);
                                            }}
                                            className="flex-1 bg-bg-tertiary rounded-xl py-4 mr-2"
                                        >
                                            <Text className="text-txt-primary text-center font-bold text-base">
                                                Cancel
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                handleAddItem();
                                            }}
                                            className="flex-1 bg-accent-cyan rounded-xl py-4 ml-2"
                                        >
                                            <Text className="text-bg-primary text-center font-bold text-base">
                                                Add Item
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>


            {/* Save Trade Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/70 justify-end">
                    <View
                        className="bg-bg-secondary rounded-t-3xl p-6 border-t border-border"
                        style={{ maxHeight: '80%' }}
                    >
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-txt-primary text-2xl font-bold">
                                Save Trade
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="w-10 h-10 bg-bg-tertiary rounded-full items-center justify-center"
                            >
                                <Text className="text-txt-primary text-xl font-bold">×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="bg-bg-tertiary rounded-xl p-4 mb-4">
                                <Text className="text-txt-secondary text-sm mb-3 text-center">
                                    Overall Score
                                </Text>
                                <Text
                                    className="text-6xl font-bold text-center"
                                    style={{ color: setupCategory.color }}
                                >
                                    {overallPercentage}%
                                </Text>
                            </View>

                            <Text className="text-txt-secondary text-sm mb-4">
                                This will save your trade setup with the current checklist score. You can add more details in the Journal tab.
                            </Text>

                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    className="flex-1 bg-bg-tertiary rounded-xl py-4 mr-2"
                                >
                                    <Text className="text-txt-primary text-center font-bold text-base">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setModalVisible(false);
                                        Alert.alert('Success', 'Trade saved! Add more details in Journal tab.');
                                    }}
                                    className="flex-1 bg-accent-cyan rounded-xl py-4 ml-2"
                                >
                                    <Text className="text-bg-primary text-center font-bold text-base">
                                        Confirm
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
