import { View, Text } from 'react-native';

export default function JournalScreen() {
    return (
        <View className="flex-1 bg-bg-primary items-center justify-center p-4">
            <Text className="text-txt-primary text-2xl font-bold mb-2">
                Trade Journal
            </Text>
            <Text className="text-txt-secondary text-center">
                Your trade entries will appear here
            </Text>
        </View>
    );
}
