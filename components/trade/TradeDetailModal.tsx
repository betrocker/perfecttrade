import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';


interface Trade {
    id: string;
    currency_pair: string;
    direction: 'LONG' | 'SHORT';
    entry_price: number;
    take_profit_price: number | null;
    stop_loss_price: number | null;
    account_balance: number | null;
    stop_loss_pips: number | null;
    risk_percentage: number | null;
    calculated_lot_size: number | string | null;
    confluence_score: number;
    confluence_data: any; // ← Dodaj ovo
    notes: string | null;
    chart_image_url: string | null;
    after_trade_image_url: string | null;
    status: 'PLANNED' | 'OPEN' | 'CLOSED';
    profit_loss: number | null;
    exit_price: number | null;
    created_at: string;
    updated_at: string;
    user_id: string;
}

interface TradeDetailModalProps {
    visible: boolean;
    trade: Trade;
    onClose: () => void;
    onDelete: (tradeId: string) => void;
    onUpdate: () => void;
}

type TabType = 'update' | 'summary';

export default function TradeDetailModal({
                                             visible,
                                             trade,
                                             onClose,
                                             onDelete,
                                             onUpdate,
                                         }: TradeDetailModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('update');
    const [tradeOutcome, setTradeOutcome] = useState<'Win' | 'Loss' | 'Break-Even'>('Win');
    const [profitAmount, setProfitAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [afterTradeImage, setAfterTradeImage] = useState<string | null>(null);
    const [uploadingAfter, setUploadingAfter] = useState(false);


    // Proveri da li je trade već zatvoren
    const isClosed = trade.status === 'CLOSED';

    const handleSaveChanges = async () => {
        if (!profitAmount) {
            Alert.alert('Error', 'Please enter profit amount');
            return;
        }

        if (!afterTradeImage) {
            Alert.alert('Error', 'Please upload after trade chart image');
            return;
        }

        setSaving(true);
        try {
            // Upload after image
            setUploadingAfter(true);
            const afterImageUrl = await uploadAfterImage(afterTradeImage);
            setUploadingAfter(false);

            if (!afterImageUrl) {
                Alert.alert('Error', 'Failed to upload after trade image');
                setSaving(false);
                return;
            }

            const profitValue = parseFloat(profitAmount);
            const finalProfit =
                tradeOutcome === 'Loss' ? -Math.abs(profitValue) :
                    tradeOutcome === 'Break-Even' ? 0 : profitValue;

            const updates = {
                status: 'CLOSED',
                profit_loss: finalProfit,
                after_trade_image_url: afterImageUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('trades').update(updates).eq('id', trade.id);

            if (error) throw error;

            Alert.alert('Success', 'Trade updated successfully');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error updating trade:', error);
            Alert.alert('Error', 'Failed to update trade');
        } finally {
            setSaving(false);
        }
    };


    const OutcomeButton = ({ outcome, label }: { outcome: string; label: string }) => {
        const isSelected = tradeOutcome === outcome;

        let bgClass = 'bg-transparent border-border';
        let textClass = 'text-txt-secondary';

        if (isSelected) {
            if (outcome === 'Win') {
                bgClass = 'bg-success/20 border-success';
                textClass = 'text-success';
            } else if (outcome === 'Loss') {
                bgClass = 'bg-error/20 border-error';
                textClass = 'text-error';
            } else { // Break-Even
                bgClass = 'bg-warning/20 border-warning';
                textClass = 'text-warning';
            }
        }

        return (
            <TouchableOpacity
                onPress={() => setTradeOutcome(outcome as any)}
                className={`flex-1 py-3 rounded-lg border ${bgClass}`}
            >
                <Text className={`font-semibold text-center ${textClass}`}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const pickAfterImage = async (useCamera: boolean = false) => {
        if (isClosed) return; // Ne dozvoli ako je closed

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
                Alert.alert('Permission Required', 'Please allow access to photos');
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
            setAfterTradeImage(result.assets[0].uri);
        }
    };

    // Upload after image funkcija:
    const uploadAfterImage = async (imageUri: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `after-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            console.log('📤 Uploading after trade image to:', filePath);

            const response = await fetch(imageUri);
            if (!response.ok) return null;

            const arrayBuffer = await response.arrayBuffer();
            console.log('📦 After image size:', arrayBuffer.byteLength);

            if (arrayBuffer.byteLength === 0) return null;

            const { data, error } = await supabase.storage
                .from('trade-charts')
                .upload(filePath, arrayBuffer, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ After image upload error:', error);
                return null;
            }

            const { data: urlData } = supabase.storage
                .from('trade-charts')
                .getPublicUrl(filePath);

            console.log('✅ After image URL:', urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error: any) {
            console.error('💥 After image upload error:', error);
            return null;
        }
    };


    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 bg-bg-primary"
            >
                {/* Header */}
                <View className="px-4 pt-12 pb-4 bg-bg-primary border-b border-border">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-txt-primary text-xl font-bold">Update Trade</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row" style={{ gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => setActiveTab('update')}
                            className={`flex-1 pb-3 border-b-2 ${
                                activeTab === 'update' ? 'border-accent-cyan' : 'border-transparent'
                            }`}
                        >
                            <Text
                                className={`text-center font-semibold ${
                                    activeTab === 'update' ? 'text-accent-cyan' : 'text-txt-secondary'
                                }`}
                            >
                                Update Trade
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('summary')}
                            className={`flex-1 pb-3 border-b-2 ${
                                activeTab === 'summary' ? 'border-accent-cyan' : 'border-transparent'
                            }`}
                        >
                            <Text
                                className={`text-center font-semibold ${
                                    activeTab === 'summary' ? 'text-accent-cyan' : 'text-txt-secondary'
                                }`}
                            >
                                Confluence Summary
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1">
                    {activeTab === 'update' ? (
                        /* UPDATE TAB */
                        <View className="p-4" style={{ gap: 20 }}>
                            {/* Confluence Score */}
                            <View className="bg-accent-cyan/10 border border-accent-cyan rounded-xl p-4">
                                <Text className="text-accent-cyan text-lg font-bold">
                                    Confluence Score: {trade.confluence_score}%
                                </Text>
                            </View>

                            {/* Currency Pair */}
                            <View>
                                <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                    <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                                    <Text className="text-txt-secondary text-sm">
                                        Currency Pair (Locked)
                                    </Text>
                                </View>
                                <View className="bg-bg-secondary border border-border rounded-lg p-4">
                                    <Text className="text-txt-secondary text-xs mb-1">
                                        {trade.currency_pair.split('/')[0]} /{' '}
                                        {trade.currency_pair.split('/')[1] || 'CHF'}
                                    </Text>
                                    <Text className="text-txt-primary text-xl font-bold">
                                        {trade.currency_pair.replace('/', '')}
                                    </Text>
                                </View>
                            </View>

                            {/* Direction */}
                            <View>
                                <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                    <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                                    <Text className="text-txt-secondary text-sm">
                                        Direction (Locked)
                                    </Text>
                                </View>
                                <View
                                    className={`rounded-lg p-4 ${
                                        trade.direction === 'LONG' ? 'bg-success/20' : 'bg-error/20'
                                    }`}
                                >
                                    <Text
                                        className={`text-center text-2xl font-bold ${
                                            trade.direction === 'LONG' ? 'text-success' : 'text-error'
                                        }`}
                                    >
                                        {trade.direction}
                                    </Text>
                                </View>
                            </View>

                            {/* Account & Risk - Locked */}
                            <View>
                                <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                    <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                                    <Text className="text-txt-primary font-bold">
                                        Account & Risk (Locked)
                                    </Text>
                                </View>
                                <View className="flex-row" style={{ gap: 12 }}>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                                            <Text className="text-txt-secondary text-xs">
                                                Account Balance
                                            </Text>
                                        </View>
                                        <View className="bg-bg-secondary border border-border rounded-lg p-3">
                                            <Text className="text-txt-primary font-semibold">
                                                {trade.account_balance
                                                    ? `$${trade.account_balance.toFixed(0)}`
                                                    : 'Not set'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                                            <Text className="text-txt-secondary text-xs">
                                                Risk Percentage
                                            </Text>
                                        </View>
                                        <View className="bg-bg-secondary border border-border rounded-lg p-3">
                                            <Text className="text-txt-primary font-semibold">
                                                {trade.risk_percentage
                                                    ? `${trade.risk_percentage}%`
                                                    : 'Not set'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Trade Parameters - Locked */}
                            <View>
                                <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                    <Ionicons name="ellipse-outline" size={14} color="#FFFFFF" />
                                    <Text className="text-txt-primary font-bold">
                                        Trade Parameters (Locked)
                                    </Text>
                                </View>
                                <View className="flex-row" style={{ gap: 12, marginBottom: 12 }}>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                                            <Text className="text-txt-secondary text-xs">
                                                Stop Loss Price
                                            </Text>
                                        </View>
                                        <View className="bg-bg-secondary border border-border rounded-lg p-3">
                                            <Text className="text-error font-bold">
                                                {trade.stop_loss_price?.toFixed(5) || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                                            <Text className="text-txt-secondary text-xs">
                                                Take Profit Price
                                            </Text>
                                        </View>
                                        <View className="bg-bg-secondary border border-border rounded-lg p-3">
                                            <Text className="text-success font-bold">
                                                {trade.take_profit_price?.toFixed(5) || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="flex-row" style={{ gap: 12 }}>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                                            <Text className="text-txt-secondary text-xs">
                                                Entry Price
                                            </Text>
                                        </View>
                                        <View className="bg-bg-secondary border border-border rounded-lg p-3">
                                            <Text className="text-txt-primary font-bold">
                                                {trade.entry_price?.toFixed(5) || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                                            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                                            <Text className="text-txt-secondary text-xs">Lot Size</Text>
                                        </View>
                                        <View className="bg-bg-secondary border border-border rounded-lg p-3">
                                            <Text className="text-txt-primary font-semibold">
                                                {typeof trade.calculated_lot_size === 'number'
                                                    ? `${trade.calculated_lot_size.toFixed(2)}`
                                                    : trade.calculated_lot_size || 'Not calculated'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Notes */}
                            {trade.notes && (
                                <View>
                                    <Text className="text-txt-secondary text-sm mb-2">Notes</Text>
                                    <View className="bg-bg-secondary border border-border rounded-lg p-4">
                                        <Text className="text-txt-primary leading-6">
                                            {trade.notes}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Chart Images */}
                            <View>
                                <Text className="text-txt-primary font-bold text-lg mb-3">
                                    Chart Images
                                </Text>
                                <View className="flex-row" style={{ gap: 12 }}>
                                    {/* Before Trade */}
                                    <View className="flex-1">
                                        <Text className="text-txt-secondary text-sm mb-2">
                                            Before Trade (Read-only)
                                        </Text>
                                        {trade.chart_image_url ? (
                                            <Image
                                                source={{
                                                    uri: `${trade.chart_image_url}?t=${Date.now()}`,
                                                }}
                                                style={{ width: '100%', height: 160, borderRadius: 8 }}
                                                resizeMode="cover"
                                                onLoad={() => console.log('✅ Image loaded!')}
                                                onError={(e) => console.log('❌ Error:', e.nativeEvent.error)}
                                            />
                                        ) : (
                                            <View className="w-full h-40 rounded-lg bg-bg-tertiary items-center justify-center border border-border">
                                                <Ionicons name="image-outline" size={32} color="#6B7280" />
                                                <Text className="text-txt-tertiary text-xs mt-2">No image</Text>
                                            </View>
                                        )}

                                    </View>


                                    {/* After Trade */}
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2" style={{ gap: 4 }}>
                                            <Text className="text-txt-secondary text-sm">After Trade</Text>
                                            {!isClosed && <Text className="text-error text-xs">* Required</Text>}
                                        </View>

                                        {afterTradeImage ? (
                                            // Ako je upload-ovana slika lokalno (pre save)
                                            <View className="relative">
                                                <Image
                                                    source={{ uri: afterTradeImage }}
                                                    style={{ width: '100%', height: 160, borderRadius: 8 }}
                                                    resizeMode="cover"
                                                />
                                                {!isClosed && (
                                                    <TouchableOpacity
                                                        onPress={() => setAfterTradeImage(null)}
                                                        className="absolute top-2 right-2 bg-error rounded-full p-1"
                                                    >
                                                        <Ionicons name="close" size={16} color="#FFF" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ) : trade.after_trade_image_url ? (
                                            // Ako postoji sačuvana slika u bazi
                                            <Image
                                                source={{ uri: `${trade.after_trade_image_url}?t=${Date.now()}` }}
                                                style={{ width: '100%', height: 160, borderRadius: 8 }}
                                                resizeMode="cover"
                                                onLoad={() => console.log('✅ After image loaded')}
                                                onError={(e) => console.log('❌ After image error:', e.nativeEvent.error)}
                                            />
                                        ) : isClosed ? (
                                            // Ako je closed ali nema after slike
                                            <View className="w-full h-40 rounded-lg bg-bg-tertiary items-center justify-center border border-border">
                                                <Ionicons name="image-outline" size={32} color="#6B7280" />
                                                <Text className="text-txt-tertiary text-xs mt-2">No after image</Text>
                                            </View>
                                        ) : (
                                            // Ako nije closed - omogući upload
                                            <TouchableOpacity
                                                onPress={() => pickAfterImage(false)}
                                                className="w-full h-40 rounded-lg bg-info/20 border border-info items-center justify-center"
                                            >
                                                <Ionicons name="cloud-upload" size={32} color="#3B82F6" />
                                                <Text className="text-info text-xs mt-2">Upload</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>


                                </View>
                            </View>

                            {/* Trade Outcome - SAMO ako nije closed */}
                            {!isClosed && (
                                <View>
                                    <Text className="text-txt-primary font-bold text-lg mb-3">
                                        Trade Outcome
                                    </Text>
                                    <View className="flex-row mb-4" style={{ gap: 12 }}>
                                        <OutcomeButton outcome="Win" label="Win" />
                                        <OutcomeButton outcome="Loss" label="Loss" />
                                        <OutcomeButton outcome="Break-Even" label="Break-Even" />
                                    </View>

                                    <View>
                                        <Text className="text-accent-cyan text-sm mb-2">
                                            Actual Profit Amount ($) *
                                        </Text>
                                        <TextInput
                                            value={profitAmount}
                                            onChangeText={setProfitAmount}
                                            placeholder="2,100"
                                            placeholderTextColor="#6B7280"
                                            keyboardType="numeric"
                                            className="bg-bg-secondary border border-border rounded-lg px-4 py-4 text-txt-primary text-lg"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Locked Message */}
                            {isClosed && (
                                <View className="bg-warning/10 border border-warning rounded-lg p-4">
                                    <View className="flex-row items-center" style={{ gap: 10 }}>
                                        <Ionicons name="lock-closed" size={24} color="#F59E0B" />
                                        <View className="flex-1">
                                            <Text className="text-warning font-bold text-base mb-1">
                                                Trade Locked
                                            </Text>
                                            <Text className="text-txt-secondary text-sm">
                                                This trade is closed and cannot be edited
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View className="flex-row" style={{ gap: 12 }}>
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="flex-1 bg-bg-secondary border border-border py-4 rounded-lg"
                                >
                                    <Text className="text-txt-secondary text-center font-semibold">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                {!isClosed && (
                                    <TouchableOpacity
                                        onPress={handleSaveChanges}
                                        disabled={saving}
                                        className={`flex-1 py-4 rounded-lg flex-row items-center justify-center ${
                                            saving ? 'bg-accent-cyan/50' : 'bg-accent-cyan'
                                        }`}
                                        style={{ gap: 8 }}
                                    >
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color="#1B2838"
                                        />
                                        <Text className="text-bg-primary font-bold text-base">
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Delete Button */}
                            <TouchableOpacity
                                onPress={() => onDelete(trade.id)}
                                className="bg-error/10 border border-error py-3 rounded-lg"
                            >
                                <Text className="text-error text-center font-semibold">
                                    Delete Trade
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* CONFLUENCE SUMMARY TAB */
                        <View className="p-4">
                            <Text className="text-txt-primary text-lg font-bold mb-4">
                                Confluence Summary
                            </Text>

                            {/* Debug info */}
                            <View className="bg-warning/10 border border-warning rounded-lg p-3 mb-4">
                                <Text className="text-warning text-xs font-mono">
                                    DEBUG: {JSON.stringify(trade.confluence_data)}
                                </Text>
                            </View>

                            {/* Confluence Score Box */}
                            <View className="bg-accent-cyan/10 border border-accent-cyan rounded-xl p-4 mb-4">
                                <View className="items-center">
                                    <Text className="text-accent-cyan text-5xl font-bold">
                                        {trade.confluence_score}%
                                    </Text>
                                    <Text className="text-txt-secondary text-sm mt-2">
                                        Total Confluence Score
                                    </Text>
                                    {trade.confluence_data?.timestamp && (
                                        <Text className="text-txt-tertiary text-xs mt-1">
                                            {new Date(trade.confluence_data.timestamp).toLocaleString()}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Confluence Category Badge */}
                            <View className="flex-row justify-center mb-4">
                                <View
                                    className={`px-4 py-2 rounded-full ${
                                        trade.confluence_score >= 100
                                            ? 'bg-success/20'
                                            : trade.confluence_score >= 80
                                                ? 'bg-accent-cyan/20'
                                                : trade.confluence_score >= 60
                                                    ? 'bg-warning/20'
                                                    : 'bg-error/20'
                                    }`}
                                >
                                    <Text
                                        className={`font-bold ${
                                            trade.confluence_score >= 100
                                                ? 'text-success'
                                                : trade.confluence_score >= 80
                                                    ? 'text-accent-cyan'
                                                    : trade.confluence_score >= 60
                                                        ? 'text-warning'
                                                        : 'text-error'
                                        }`}
                                    >
                                        {trade.confluence_score >= 100
                                            ? '🎯 Perfect Trade'
                                            : trade.confluence_score >= 80
                                                ? '✨ Strong Setup'
                                                : trade.confluence_score >= 60
                                                    ? '⚠️ Medium Setup'
                                                    : '❌ Weak Setup'}
                                    </Text>
                                </View>
                            </View>

                            {/* Confluence Items Breakdown */}
                            {trade.confluence_data?.items && trade.confluence_data.items.length > 0 ? (
                                <View className="bg-bg-secondary rounded-lg p-4">
                                    <Text className="text-txt-primary font-bold mb-3">
                                        Checked Confluence Factors
                                    </Text>
                                    {trade.confluence_data.items.map((item: any, index: number) => (
                                        <View
                                            key={index}
                                            className="flex-row items-center py-3 border-b border-border"
                                        >
                                            <Ionicons
                                                name={item.checked ? 'checkmark-circle' : 'close-circle'}
                                                size={22}
                                                color={item.checked ? '#10B981' : '#6B7280'}
                                            />
                                            <View className="flex-1 ml-3">
                                                <Text
                                                    className={
                                                        item.checked ? 'text-txt-primary' : 'text-txt-tertiary'
                                                    }
                                                >
                                                    {item.label}
                                                </Text>
                                                {item.timeframe && (
                                                    <Text className="text-txt-tertiary text-xs mt-1">
                                                        {item.timeframe}
                                                    </Text>
                                                )}
                                            </View>
                                            <Text
                                                className={
                                                    item.checked ? 'text-accent-cyan' : 'text-txt-tertiary'
                                                }
                                            >
                                                +{item.weight || 0}%
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                /* No Data Placeholder */
                                <View className="bg-bg-secondary rounded-lg p-6">
                                    <View className="items-center">
                                        <Ionicons name="analytics-outline" size={48} color="#6B7280" />
                                        <Text className="text-txt-secondary text-center mt-3">
                                            No detailed confluence data available
                                        </Text>
                                        <Text className="text-txt-tertiary text-xs text-center mt-2">
                                            This trade was saved with only a total score
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Info Box */}
                            <View className="bg-info/10 border border-info rounded-lg p-3 mt-4">
                                <View className="flex-row items-start">
                                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                    <View className="flex-1 ml-2">
                                        <Text className="text-info font-semibold text-sm mb-1">
                                            About Confluence Score
                                        </Text>
                                        <Text className="text-txt-secondary text-xs">
                                            The confluence score represents the alignment of multiple technical
                                            factors across different timeframes. Higher scores indicate stronger
                                            trade setups.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Score Breakdown Guide */}
                            <View className="mt-4">
                                <Text className="text-txt-secondary text-sm font-semibold mb-2">
                                    Score Categories
                                </Text>
                                <View className="bg-bg-secondary rounded-lg p-3 space-y-2">
                                    <View className="flex-row items-center justify-between py-1">
                                        <Text className="text-txt-primary text-sm">🎯 Perfect Trade</Text>
                                        <Text className="text-success text-sm font-semibold">100%+</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between py-1">
                                        <Text className="text-txt-primary text-sm">✨ Strong Setup</Text>
                                        <Text className="text-accent-cyan text-sm font-semibold">80-99%</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between py-1">
                                        <Text className="text-txt-primary text-sm">⚠️ Medium Setup</Text>
                                        <Text className="text-warning text-sm font-semibold">60-79%</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between py-1">
                                        <Text className="text-txt-primary text-sm">❌ Weak Setup</Text>
                                        <Text className="text-error text-sm font-semibold">{'<60%'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}
