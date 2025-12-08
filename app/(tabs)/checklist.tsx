import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import DefaultChecklist from '@/components/checklist/DefaultChecklist';
import CustomChecklist from '@/components/checklist/CustomChecklist';

type ChecklistTab = 'default' | 'custom';

export default function ChecklistScreen() {
    const [activeTab, setActiveTab] = useState<ChecklistTab>('default');
    const [checkedItems, setCheckedItems] = useState<any[]>([]);


    return (
        <View className="flex-1 bg-bg-primary">
            {/* iOS Style Segmented Control */}
            <View className="px-4 pt-3 pb-2 bg-bg-primary">
                <View
                    style={{
                        borderRadius: 10,
                        backgroundColor: 'rgba(118, 118, 128, 0.24)',
                        padding: 2,
                        flexDirection: 'row',
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setActiveTab('default')}
                        activeOpacity={0.8}
                        style={{ flex: 1, marginRight: 2 }}
                    >
                        <View
                            style={{
                                paddingVertical: 8,
                                borderRadius: 7,
                                backgroundColor: activeTab === 'default' ? 'rgba(0, 245, 212, 0.15)' : 'transparent',
                                borderWidth: activeTab === 'default' ? 1 : 0,
                                borderColor: activeTab === 'default' ? 'rgba(0, 245, 212, 0.4)' : 'transparent',
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    fontSize: 14,
                                    color: activeTab === 'default' ? '#00F5D4' : 'rgba(139, 149, 165, 0.8)',
                                }}
                            >
                                Default Checklist
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('custom')}
                        activeOpacity={0.8}
                        style={{ flex: 1, marginLeft: 2 }}
                    >
                        <View
                            style={{
                                paddingVertical: 8,
                                borderRadius: 7,
                                backgroundColor: activeTab === 'custom' ? 'rgba(0, 245, 212, 0.15)' : 'transparent',
                                borderWidth: activeTab === 'custom' ? 1 : 0,
                                borderColor: activeTab === 'custom' ? 'rgba(0, 245, 212, 0.4)' : 'transparent',
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    fontSize: 14,
                                    color: activeTab === 'custom' ? '#00F5D4' : 'rgba(139, 149, 165, 0.8)',
                                }}
                            >
                                My Checklist
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View className="flex-1">
                {activeTab === 'default' ? <DefaultChecklist /> : <CustomChecklist />}
            </View>
        </View>
    );
}
