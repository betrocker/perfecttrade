import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import {useEffect, useState} from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { ActivityIndicator } from 'react-native';
import { useChecklist } from '@/context/ChecklistContext';

type SaveTradeModalProps = {
    visible: boolean;
    onClose: () => void;
    confluenceScore: number;
    confluenceColor: string;
    checkedItems: any[]; // ← DODAJ OVO
};

export default function SaveTradeModal({ visible, onClose, confluenceScore, confluenceColor, checkedItems }: SaveTradeModalProps) {
    const [currencyPair, setCurrencyPair] = useState('');
    const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
    const [accountBalance, setAccountBalance] = useState('10000');
    const [stopLossPrice, setStopLossPrice] = useState('');
    const [takeProfitPrice, setTakeProfitPrice] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [riskPercentage, setRiskPercentage] = useState('2');
    const [notes, setNotes] = useState('');
    const [chartImage, setChartImage] = useState<string | null>(null);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [stopLossPips, setStopLossPips] = useState('');
    const [saving, setSaving] = useState(false);
    const { getConfluenceData } = useChecklist();

    const currencyPairs = [
        'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
        'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD',
        'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'GBP/CAD', 'GBP/NZD',
        'AUD/JPY', 'AUD/NZD', 'AUD/CAD', 'AUD/CHF',
        'NZD/JPY', 'NZD/CAD', 'NZD/CHF',
        'CAD/JPY', 'CAD/CHF',
        'CHF/JPY',
        'USD/TRY', 'USD/ZAR', 'USD/MXN', 'EUR/TRY', 'GBP/TRY',
    ];

    const getPipValue = (pair: string): number => {
        if (pair.endsWith('USD')) return 10;
        if (pair.includes('JPY')) return 10;
        if (pair.startsWith('EUR')) return 10;
        if (pair.startsWith('GBP')) return 10;
        if (pair.startsWith('AUD')) return 10;
        if (pair.startsWith('NZD')) return 10;
        return 10;
    };

    const calculateLotSize = () => {
        const balance = parseFloat(accountBalance);
        const risk = parseFloat(riskPercentage);
        const stopLoss = parseFloat(stopLossPips);

        if (!balance || !risk || !stopLoss || stopLoss <= 0) {
            return 'Enter Stop Loss in pips to calculate';
        }

        if (!currencyPair) {
            return 'Select currency pair first';
        }

        const riskAmountUSD = (balance * risk) / 100;
        const pipValue = getPipValue(currencyPair);
        const standardLots = riskAmountUSD / (stopLoss * pipValue);

        if (standardLots < 0.01) {
            const microLots = Math.round(standardLots * 1000);
            return `${microLots} micro lots (${standardLots.toFixed(4)} lots)`;
        } else if (standardLots < 0.1) {
            return `${(standardLots * 100).toFixed(2)} mini lots (${standardLots.toFixed(3)} lots)`;
        } else if (standardLots < 1) {
            return `${standardLots.toFixed(3)} lots`;
        } else {
            return `${standardLots.toFixed(2)} lots`;
        }
    };

    useEffect(() => {
        if (accountBalance && riskPercentage && stopLossPips) {
            const timer = setTimeout(() => {}, 100);
            return () => clearTimeout(timer);
        }
    }, [accountBalance, riskPercentage, stopLossPips]);

    const pickImage = async (useCamera: boolean = false) => {
        let result;

        if (useCamera) {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow camera access');
                return;
            }
            result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });
        } else {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos');
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });
        }

        if (!result.canceled) {
            setChartImage(result.assets[0].uri);
        }
    };

    const uploadChartImage = async (imageUri: string) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('❌ Auth error or no user');
                return null;
            }

            const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            console.log('📤 Uploading to:', filePath);
            console.log('📍 From URI:', imageUri);

            // Fetch image as arrayBuffer (bolje za React Native)
            const response = await fetch(imageUri);
            if (!response.ok) {
                console.error('❌ Fetch failed:', response.status);
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            console.log('📦 ArrayBuffer size:', arrayBuffer.byteLength);

            if (arrayBuffer.byteLength === 0) {
                console.error('❌ Empty ArrayBuffer');
                return null;
            }

            // Upload using arrayBuffer
            const { data, error } = await supabase.storage
                .from('trade-charts')
                .upload(filePath, arrayBuffer, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Upload error:', error);
                return null;
            }

            console.log('✅ Upload success:', data);

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('trade-charts')
                .getPublicUrl(filePath);

            console.log('🔗 Public URL:', urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error: any) {
            console.error('💥 Upload error:', error);
            return null;
        }
    };


    const handleSave = async () => {
        const confluenceItems = getConfluenceData();
        const confluenceData = {
            score: confluenceScore,
            timestamp: new Date().toISOString(),
            items: confluenceItems
        };
        if (!currencyPair) {
            Alert.alert('Error', 'Please select a currency pair');
            return;
        }
        if (!stopLossPips || parseFloat(stopLossPips) <= 0) {
            Alert.alert('Error', 'Please enter Stop Loss in pips');
            return;
        }
        if (!riskPercentage || parseFloat(riskPercentage) <= 0) {
            Alert.alert('Error', 'Please enter Risk Percentage');
            return;
        }

        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'You must be logged in to save trades');
                setSaving(false);
                return;
            }

            let chartImageUrl = null;
            if (chartImage) {
                console.log('🖼️ Uploading chart image...');
                chartImageUrl = await uploadChartImage(chartImage);
            }

            const lotSize = calculateLotSize();

            // ← KORISTI checkedItems
            const confluenceData = {
                score: confluenceScore,
                timestamp: new Date().toISOString(),
                items: checkedItems // ← OVO JE KLJUČNO
            };

            console.log('💾 Saving confluence data:', confluenceData);

            const { data: trade, error: tradeError } = await supabase
                .from('trades')
                .insert([
                    {
                        user_id: user.id,
                        currency_pair: currencyPair,
                        direction: direction,
                        account_balance: parseFloat(accountBalance),
                        stop_loss_pips: parseInt(stopLossPips),
                        risk_percentage: parseFloat(riskPercentage),
                        calculated_lot_size: lotSize,
                        entry_price: entryPrice ? parseFloat(entryPrice) : null,
                        stop_loss_price: stopLossPrice ? parseFloat(stopLossPrice) : null,
                        take_profit_price: takeProfitPrice ? parseFloat(takeProfitPrice) : null,
                        confluence_score: confluenceScore,
                        confluence_data: confluenceData, // ← ČUVA SVE ITEMS
                        notes: notes || null,
                        status: 'PLANNED',
                        chart_image_url: chartImageUrl,
                    },
                ])
                .select()
                .single();

            if (tradeError) throw tradeError;

            Alert.alert('Success! 🎉', 'Your trade has been saved successfully.', [
                {
                    text: 'OK',
                    onPress: () => {
                        onClose();
                        setCurrencyPair('');
                        setDirection('LONG');
                        setStopLossPips('');
                        setRiskPercentage('2');
                        setEntryPrice('');
                        setStopLossPrice('');
                        setTakeProfitPrice('');
                        setNotes('');
                        setChartImage(null);
                    },
                },
            ]);
        } catch (error: any) {
            console.error('❌ Save error:', error);
            Alert.alert('Error', 'Failed to save trade. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/70">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end"
                >
                    <View
                        className="bg-bg-primary rounded-t-3xl border-t border-border"
                        style={{ height: '95%' }}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center p-5 border-b border-border">
                            <Text className="text-txt-primary text-2xl font-bold">
                                Save Trade
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-10 h-10 bg-bg-tertiary rounded-full items-center justify-center"
                            >
                                <Text className="text-txt-primary text-xl font-bold">×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            className="flex-1"
                            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Confluence Score */}
                            <View
                                className="my-4 rounded-xl p-4 border"
                                style={{
                                    backgroundColor: 'rgba(0, 245, 212, 0.1)',
                                    borderColor: 'rgba(0, 245, 212, 0.3)',
                                }}
                            >
                                <Text className="text-accent-cyan text-sm font-semibold">
                                    Confluence Score: {confluenceScore}%
                                </Text>
                            </View>

                            {/* Currency Pair */}
                            <View className="mb-4">
                                <Text className="text-txt-primary text-base font-semibold mb-2">
                                    Currency Pair <Text className="text-red-500">*</Text>
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                                    className="bg-bg-secondary rounded-lg p-4 border border-border flex-row justify-between items-center"
                                >
                                    <Text className={currencyPair ? "text-txt-primary" : "text-txt-tertiary"}>
                                        {currencyPair || "Select currency pair"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#8B95A5" />
                                </TouchableOpacity>

                                {showCurrencyPicker && (
                                    <View className="bg-bg-secondary rounded-lg mt-2 border border-border max-h-60">
                                        <ScrollView>
                                            {currencyPairs.map((pair, index) => (
                                                <TouchableOpacity
                                                    key={pair}
                                                    onPress={() => {
                                                        setCurrencyPair(pair);
                                                        setShowCurrencyPicker(false);
                                                    }}
                                                    className="p-4"
                                                    style={{
                                                        borderBottomWidth: index < currencyPairs.length - 1 ? 1 : 0,
                                                        borderBottomColor: '#3A4F64',
                                                    }}
                                                >
                                                    <Text className="text-txt-primary">{pair}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Direction */}
                            <View className="mb-4">
                                <Text className="text-txt-primary text-base font-semibold mb-2">
                                    Direction <Text className="text-red-500">*</Text>
                                </Text>
                                <View className="flex-row">
                                    <TouchableOpacity
                                        onPress={() => setDirection('LONG')}
                                        className="flex-1 mr-2 rounded-lg p-4 border"
                                        style={{
                                            backgroundColor: direction === 'LONG' ? 'rgba(0, 245, 212, 0.15)' : 'transparent',
                                            borderColor: direction === 'LONG' ? '#00F5D4' : '#3A4F64',
                                        }}
                                    >
                                        <Text
                                            className="text-center font-bold"
                                            style={{ color: direction === 'LONG' ? '#00F5D4' : '#8B95A5' }}
                                        >
                                            LONG
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setDirection('SHORT')}
                                        className="flex-1 ml-2 rounded-lg p-4 border"
                                        style={{
                                            backgroundColor: direction === 'SHORT' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                            borderColor: direction === 'SHORT' ? '#EF4444' : '#3A4F64',
                                        }}
                                    >
                                        <Text
                                            className="text-center font-bold"
                                            style={{ color: direction === 'SHORT' ? '#EF4444' : '#8B95A5' }}
                                        >
                                            SHORT
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Account Balance */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="wallet-outline" size={20} color="#00F5D4" />
                                    <Text className="text-txt-primary text-base font-semibold ml-2">
                                        Account Balance <Text className="text-red-500">*</Text>
                                    </Text>
                                </View>
                                <TextInput
                                    className="bg-bg-secondary text-txt-primary rounded-lg p-4 border border-border"
                                    placeholder="10,000"
                                    placeholderTextColor="#8B95A5"
                                    value={accountBalance}
                                    onChangeText={setAccountBalance}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Trade Parameters */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-3">
                                    <Ionicons name="trending-up-outline" size={20} color="#00F5D4" />
                                    <Text className="text-txt-primary text-lg font-bold ml-2">
                                        Trade Parameters
                                    </Text>
                                </View>

                                <View className="flex-row mb-4">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-red-500 text-sm font-semibold mb-2">
                                            Stop Loss (pips) <Text className="text-red-500">*</Text>
                                        </Text>
                                        <TextInput
                                            className="bg-bg-secondary text-txt-primary rounded-lg p-4 border border-border text-center"
                                            placeholder="50"
                                            placeholderTextColor="#8B95A5"
                                            value={stopLossPips}
                                            onChangeText={setStopLossPips}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View className="flex-1 ml-2">
                                        <Text className="text-txt-primary text-sm font-semibold mb-2">
                                            Risk Percentage (%) <Text className="text-red-500">*</Text>
                                        </Text>
                                        <TextInput
                                            className="bg-bg-secondary text-txt-primary rounded-lg p-4 border border-border text-center"
                                            placeholder="2"
                                            placeholderTextColor="#8B95A5"
                                            value={riskPercentage}
                                            onChangeText={setRiskPercentage}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                </View>

                                <View
                                    className="rounded-xl p-5 border-2 mb-4"
                                    style={{
                                        backgroundColor: 'rgba(0, 245, 212, 0.1)',
                                        borderColor: '#00F5D4',
                                    }}
                                >
                                    <View className="flex-row items-center justify-center mb-2">
                                        <Ionicons name="calculator" size={28} color="#00F5D4" />
                                        <Text className="text-txt-primary font-bold text-lg ml-2">
                                            Calculated Lot Size
                                        </Text>
                                    </View>
                                    <Text className="text-accent-cyan text-center text-2xl font-bold mt-2">
                                        {calculateLotSize()}
                                    </Text>
                                </View>

                                <View className="bg-bg-tertiary rounded-lg p-4 border border-border">
                                    <Text className="text-txt-secondary text-xs font-semibold mb-3">
                                        Trade Levels (Optional)
                                    </Text>

                                    <View className="flex-row mb-3">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-txt-tertiary text-xs mb-1">Entry Price</Text>
                                            <TextInput
                                                className="bg-bg-secondary text-txt-primary rounded-lg p-3 border border-border"
                                                placeholder="1.08500"
                                                placeholderTextColor="#8B95A5"
                                                value={entryPrice}
                                                onChangeText={setEntryPrice}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>

                                        <View className="flex-1 ml-2">
                                            <Text className="text-txt-tertiary text-xs mb-1">Take Profit</Text>
                                            <TextInput
                                                className="bg-bg-secondary text-txt-primary rounded-lg p-3 border border-border"
                                                placeholder="1.09000"
                                                placeholderTextColor="#8B95A5"
                                                value={takeProfitPrice}
                                                onChangeText={setTakeProfitPrice}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-txt-tertiary text-xs mb-1">Stop Loss Price</Text>
                                        <TextInput
                                            className="bg-bg-secondary text-txt-primary rounded-lg p-3 border border-border"
                                            placeholder="1.08000"
                                            placeholderTextColor="#8B95A5"
                                            value={stopLossPrice}
                                            onChangeText={setStopLossPrice}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Notes */}
                            <View className="mb-4">
                                <Text className="text-txt-primary text-base font-semibold mb-2">
                                    Notes
                                </Text>
                                <TextInput
                                    className="bg-bg-secondary text-txt-primary rounded-lg p-4 border border-border"
                                    placeholder="Add your trade notes here..."
                                    placeholderTextColor="#8B95A5"
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Chart Image Upload */}
                            <View className="mb-6">
                                <Text className="text-txt-primary text-base font-semibold mb-2">
                                    Chart Image (Before Trade)
                                </Text>

                                {chartImage ? (
                                    <View className="relative">
                                        <View className="bg-bg-secondary rounded-lg p-2 border border-border">
                                            <Text className="text-accent-cyan text-center mb-2">
                                                Image selected ✓
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setChartImage(null)}
                                            className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                                        >
                                            <Ionicons name="close" size={16} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => pickImage(false)}
                                            className="bg-bg-secondary rounded-lg p-8 border-2 border-dashed border-border items-center mb-2"
                                        >
                                            <Ionicons name="cloud-upload-outline" size={48} color="#8B95A5" />
                                            <Text className="text-txt-secondary text-center mt-2">
                                                Click to upload chart
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => pickImage(true)}
                                            className="bg-bg-tertiary rounded-lg p-3 flex-row items-center justify-center"
                                        >
                                            <Ionicons name="camera-outline" size={20} color="#00F5D4" />
                                            <Text className="text-accent-cyan font-semibold ml-2">
                                                Take Photo
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </ScrollView>

                        {/* Footer Buttons */}
                        <View className="p-5 border-t border-border flex-row bg-bg-primary">
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 bg-bg-tertiary rounded-xl py-4 mr-2"
                            >
                                <Text className="text-txt-primary text-center font-bold text-base">
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={saving}
                                className="flex-1 bg-accent-cyan rounded-xl py-4 ml-2 flex-row items-center justify-center"
                                style={{ opacity: saving ? 0.5 : 1 }}
                            >
                                {saving ? (
                                    <>
                                        <ActivityIndicator size="small" color="#1B2838" />
                                        <Text className="text-bg-primary font-bold text-base ml-2">
                                            Saving...
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#1B2838" />
                                        <Text className="text-bg-primary font-bold text-base ml-2">
                                            Save Trade
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
